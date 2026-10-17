import importlib.util
from pathlib import Path
import subprocess
import unittest

spec = importlib.util.spec_from_file_location("gmail_setup", Path(__file__).parents[1] / "scripts/configure-gmail-push.py")
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


class FakeCloud:
    def __init__(self, config, exists=True, wrong_topic=False):
        self.c = config
        self.exists = exists
        self.wrong_topic = wrong_topic
        self.calls = []

    def run(self, args, missing_ok=False):
        self.calls.append(args)
        if args[:2] == ["projects", "describe"]:
            return {"projectNumber": "573163160991"}
        if "describe" in args:
            if missing_ok and not self.exists:
                return None
            if "subscriptions" in args:
                return {"topic": "wrong" if self.wrong_topic else self.c["topic"],
                        "pushConfig": {"pushEndpoint": self.c["endpoint"], "oidcToken": {
                            "audience": self.c["endpoint"], "serviceAccountEmail": self.c["account"]}}}
            return {}
        return {}


class SetupTests(unittest.TestCase):
    def setUp(self):
        self.c = setup.config("cuebooker", "staging", setup.REFS["staging"])

    def test_environment_cannot_cross_targets(self):
        with self.assertRaises(setup.SetupError):
            setup.config("cuebooker", "production", setup.REFS["staging"])
        prod = setup.config("cuebooker", "production", setup.REFS["production"])
        self.assertLessEqual(len(prod["account_id"]), 30)
        self.assertNotEqual(prod["topic"], self.c["topic"])
        self.assertIn(setup.REFS["production"], prod["endpoint"])

    def test_conflict_stops_before_mutation(self):
        cloud = FakeCloud(self.c, wrong_topic=True)
        with self.assertRaises(setup.SetupError):
            setup.apply(self.c, cloud)
        self.assertTrue(all("describe" in call for call in cloud.calls))

    def test_existing_resources_are_not_recreated(self):
        cloud = FakeCloud(self.c)
        setup.apply(self.c, cloud)
        self.assertFalse(any(call[:3] == ["pubsub", "topics", "create"] for call in cloud.calls))
        self.assertFalse(any(call[:3] == ["pubsub", "subscriptions", "create"] for call in cloud.calls))
        update = next(call for call in cloud.calls if call[:3] == ["pubsub", "subscriptions", "update"])
        self.assertIn("--clear-push-no-wrapper-config", update)
        self.assertIn(f"--push-auth-token-audience={self.c['endpoint']}", update)
        iam = [call for call in cloud.calls if "add-iam-policy-binding" in call]
        self.assertEqual(len(iam), 2)
        self.assertIn(self.c["topic"], iam[0])
        # Stable Pub/Sub command rejects --condition; IAM service-account command supports it.
        self.assertFalse(any(arg.startswith("--condition") for arg in iam[0]))
        self.assertIn("--condition=None", iam[1])
        self.assertIn(self.c["account"], iam[1])
        self.assertFalse(any("keys" in call or "delete" in call for call in cloud.calls))

    def test_missing_resources_created(self):
        cloud = FakeCloud(self.c, exists=False)
        setup.apply(self.c, cloud)
        create = next(call for call in cloud.calls if call[:3] == ["pubsub", "subscriptions", "create"])
        self.assertIn(f"--topic={self.c['topic']}", create)
        self.assertNotIn("--push-no-wrapper", create)

    def test_permission_errors_do_not_count_as_missing(self):
        def failure(args, **kwargs):
            return subprocess.CompletedProcess(args, 1, "", "PERMISSION_DENIED: access denied")
        with self.assertRaises(setup.SetupError):
            setup.Gcloud("cuebooker", runner=failure).run(["pubsub", "topics", "describe", self.c["topic"]], missing_ok=True)

    def test_missing_and_argument_safety(self):
        calls = []
        def absent(args, **kwargs):
            calls.append(args)
            self.assertNotIn("shell", kwargs)
            return subprocess.CompletedProcess(args, 1, "", "NOT_FOUND: absent")
        self.assertIsNone(setup.Gcloud("cuebooker", runner=absent).run(["pubsub", "topics", "describe", self.c["topic"]], missing_ok=True))
        self.assertIn("--project=cuebooker", calls[0])

    def test_final_mismatch_fails(self):
        cloud = FakeCloud(self.c)
        original = cloud.run
        def mismatch(args, missing_ok=False):
            value = original(args, missing_ok)
            if "subscriptions" in args and "describe" in args and not missing_ok:
                value["pushConfig"]["oidcToken"]["audience"] = "wrong"
            return value
        cloud.run = mismatch
        with self.assertRaises(setup.SetupError):
            setup.apply(self.c, cloud)


if __name__ == "__main__":
    unittest.main()
