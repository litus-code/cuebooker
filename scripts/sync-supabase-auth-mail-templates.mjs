const API_ORIGIN = "https://api.supabase.com/v1";

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const assertProjectRef = (name, value) => {
  if (!/^[a-z0-9]{20}$/.test(value)) {
    throw new Error(`${name} is not a valid Supabase project reference`);
  }
};

const accessToken = requiredEnv("SUPABASE_ACCESS_TOKEN");
const sourceProjectRef = requiredEnv("SOURCE_SUPABASE_PROJECT_REF");
const targetProjectRef = requiredEnv("TARGET_SUPABASE_PROJECT_REF");

assertProjectRef("SOURCE_SUPABASE_PROJECT_REF", sourceProjectRef);
assertProjectRef("TARGET_SUPABASE_PROJECT_REF", targetProjectRef);

if (sourceProjectRef === targetProjectRef) {
  throw new Error("Source and target Supabase projects must be different");
}

const authConfigUrl = (projectRef) =>
  `${API_ORIGIN}/projects/${projectRef}/config/auth`;

const requestAuthConfig = async (projectRef, options = {}) => {
  const response = await fetch(authConfigUrl(projectRef), {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Supabase Management API returned ${response.status}: ${message.slice(0, 300)}`,
    );
  }

  return response.json();
};

const isMailTemplateSetting = (name) =>
  name.startsWith("mailer_subjects_") ||
  name.startsWith("mailer_templates_") ||
  name.startsWith("mailer_notifications_");

const sourceConfig = await requestAuthConfig(sourceProjectRef);
const templateConfig = Object.fromEntries(
  Object.entries(sourceConfig).filter(
    ([name, value]) =>
      isMailTemplateSetting(name) && value !== undefined && value !== null,
  ),
);

const templateNames = Object.keys(templateConfig).sort();

if (templateNames.length === 0) {
  throw new Error(
    "The staging project did not return any Auth email template settings",
  );
}

await requestAuthConfig(targetProjectRef, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(templateConfig),
});

const targetConfig = await requestAuthConfig(targetProjectRef);
const mismatches = templateNames.filter(
  (name) => targetConfig[name] !== templateConfig[name],
);

if (mismatches.length > 0) {
  throw new Error(
    `Template verification failed for ${mismatches.length} setting(s): ${mismatches.join(", ")}`,
  );
}

const subjectCount = templateNames.filter((name) =>
  name.startsWith("mailer_subjects_"),
).length;
const bodyCount = templateNames.filter((name) =>
  name.startsWith("mailer_templates_"),
).length;
const notificationCount = templateNames.filter((name) =>
  name.startsWith("mailer_notifications_"),
).length;

console.log(
  `Verified ${subjectCount} subjects, ${bodyCount} template bodies and ${notificationCount} notification settings in production.`,
);
