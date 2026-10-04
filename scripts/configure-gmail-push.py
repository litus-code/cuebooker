#!/usr/bin/env python3
"""Configure Cuebooker Gmail Pub/Sub resources. Default: offline plan only."""
import argparse
import json
import re
import shlex
import subprocess
import sys

REFS = {"staging": "lycprjeuuynfzwskycwv", "production": "qlocooqfdzehogbwcbhr"}


class SetupError(RuntimeError):
    pass


def config(project, environment, ref):
    if project != "cuebooker":
        raise SetupError("El proyecto OAuth acordado es cuebooker; revisa el script antes de usar otro.")
    if REFS.get(environment) != ref:
        raise SetupError("El proyecto Supabase no corresponde al entorno elegido.")
    suffix = "staging" if environment == "staging" else "prod"
    topic = f"projects/{project}/topics/cuebooker-gmail-{suffix}"
    return {
        "project": project,
        "topic": topic,
        "subscription": f"projects/{project}/subscriptions/cuebooker-gmail-{suffix}-push",
        "account_id": f"cuebooker-gmail-push-{suffix}",
        "account": f"cuebooker-gmail-push-{suffix}@{project}.iam.gserviceaccount.com",
        "endpoint": f"https://{ref}.supabase.co/functions/v1/gmail-mailbox-events",
    }


class Gcloud:
    def __init__(self, project, runner=subprocess.run):
        self.project = project
        self.runner = runner

    def run(self, args, missing_ok=False):
        command = ["gcloud", *args, f"--project={self.project}", "--quiet", "--format=json"]
        result = self.runner(command, capture_output=True, text=True, check=False)
        if result.returncode:
            # Never turn permission/API/auth/network errors into create attempts.
            if missing_ok and re.search(r"(?:\bNOT_FOUND\b|\bNOT_FOUND:)" , result.stderr):
                return None
            raise SetupError(f"Falló {shlex.join(command)}\n{result.stderr.strip()}")
        return json.loads(result.stdout) if result.stdout.strip() else {}


def push_args(c):
    return [f"--push-endpoint={c['endpoint']}",
            f"--push-auth-service-account={c['account']}",
            f"--push-auth-token-audience={c['endpoint']}"]


def validate_subscription(value, c):
    if value is None:
        return
    if value.get("topic") != c["topic"]:
        raise SetupError("La suscripción existente pertenece a otro topic; no se reemplaza ni se borra.")
    if any(value.get(key) for key in ("bigqueryConfig", "cloudStorageConfig", "filter", "messageTransforms")):
        raise SetupError("La suscripción tiene otro destino, filtro o transformación; requiere revisión.")


def apply(c, cloud):
    # Read and reject conflicts before any mutation. APIs must already permit these reads.
    topic = cloud.run(["pubsub", "topics", "describe", c["topic"]], missing_ok=True)
    sub = cloud.run(["pubsub", "subscriptions", "describe", c["subscription"]], missing_ok=True)
    validate_subscription(sub, c)
    account = cloud.run(["iam", "service-accounts", "describe", c["account"]], missing_ok=True)
    if account and account.get("disabled"):
        raise SetupError("La cuenta de servicio está deshabilitada; no se habilita automáticamente.")
    project = cloud.run(["projects", "describe", c["project"]])
    number = str(project.get("projectNumber", ""))
    if not number.isdigit():
        raise SetupError("No se pudo verificar el número de proyecto.")
    cloud.run(["services", "enable", "gmail.googleapis.com", "pubsub.googleapis.com", "iam.googleapis.com"])
    cloud.run(["beta", "services", "identity", "create", "--service=pubsub.googleapis.com"])
    if topic is None:
        cloud.run(["pubsub", "topics", "create", c["topic"]])
    cloud.run(["pubsub", "topics", "add-iam-policy-binding", c["topic"],
               "--member=serviceAccount:gmail-api-push@system.gserviceaccount.com",
               "--role=roles/pubsub.publisher", "--condition=None"])
    if account is None:
        cloud.run(["iam", "service-accounts", "create", c["account_id"],
                   f"--display-name={c['account_id']}"])
    cloud.run(["iam", "service-accounts", "add-iam-policy-binding", c["account"],
               f"--member=serviceAccount:service-{number}@gcp-sa-pubsub.iam.gserviceaccount.com",
               "--role=roles/iam.serviceAccountTokenCreator", "--condition=None"])
    if sub is None:
        cloud.run(["pubsub", "subscriptions", "create", c["subscription"],
                   f"--topic={c['topic']}", *push_args(c)])
    else:
        cloud.run(["pubsub", "subscriptions", "update", c["subscription"],
                   *push_args(c), "--clear-push-no-wrapper-config"])
    actual = cloud.run(["pubsub", "subscriptions", "describe", c["subscription"]])
    validate_subscription(actual, c)
    push = actual.get("pushConfig", {})
    oidc = push.get("oidcToken", {})
    if (push.get("pushEndpoint") != c["endpoint"] or
            oidc.get("serviceAccountEmail") != c["account"] or
            oidc.get("audience") != c["endpoint"] or "noWrapper" in push):
        raise SetupError("La comprobación final de endpoint/OIDC/audience/wrapper no coincide.")


def plan(c):
    print("PLAN SIN CAMBIOS. No se invoca gcloud ni se comprueba el estado remoto.")
    print(f"Proyecto: {c['project']}\nTopic: {c['topic']}\nSuscripción: {c['subscription']}")
    print(f"Cuenta OIDC: {c['account']}\nEndpoint y audience: {c['endpoint']}")
    print("Aplicación: verificar conflictos; habilitar APIs; crear recursos que falten;")
    print("añadir Publisher sólo al topic y Token Creator sólo a la cuenta OIDC;")
    print("configurar push autenticado con envoltorio JSON y verificar la suscripción.")


def settings(c):
    print("\nValores NO secretos para Edge del mismo entorno:")
    print(f"GMAIL_PUBSUB_TOPIC={c['topic']}")
    print(f"GMAIL_PUBSUB_SUBSCRIPTION={c['subscription']}")
    print(f"GMAIL_PUSH_SERVICE_ACCOUNT={c['account']}")
    print("No configura OAuth, secretos, Vault, cron ni activa detección. Ver docs/GMAIL_PUSH_SETUP.md.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--environment", required=True, choices=REFS)
    parser.add_argument("--supabase-ref", required=True)
    parser.add_argument("--apply", action="store_true", help="Aplicar usando la sesión gcloud del operador")
    args = parser.parse_args()
    try:
        c = config(args.project, args.environment, args.supabase_ref)
        if args.apply:
            apply(c, Gcloud(c["project"]))
            print("Configuración Pub/Sub aplicada y suscripción comprobada.")
        else:
            plan(c)
        settings(c)
    except (SetupError, OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
