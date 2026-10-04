// Bind browser origin and OAuth destination to the actual backend environment.
const returnUrls: Record<string, readonly string[]> = {
  'https://lycprjeuuynfzwskycwv.supabase.co': [
    'https://pr-96.cuebooker-staging.pages.dev/workspace/',
    'https://staging.cuebooker.com/workspace/',
  ],
  'https://qlocooqfdzehogbwcbhr.supabase.co': ['https://cuebooker.com/workspace/'],
}

export function mailboxReturnUrl(supabaseUrl: string, configuredReturnUrl: string): URL | null {
  if (!returnUrls[supabaseUrl]?.includes(configuredReturnUrl)) return null
  return new URL(configuredReturnUrl)
}

export function mailboxBrowserOrigin(supabaseUrl: string, configuredReturnUrl: string): string | null {
  const configured = mailboxReturnUrl(supabaseUrl, configuredReturnUrl)
  if (configured) return configured.origin
  const stable = returnUrls[supabaseUrl]?.at(-1)
  return stable ? new URL(stable).origin : null
}
