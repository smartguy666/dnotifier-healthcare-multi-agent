// packages/shared/utils/prefixedSender.ts
// Confirmed from live output (installed @dnotifier-realtime/dnotifier@1.1.20):
// msg.metadata.sender arrives as "${appId}:${userId}" (colon-separated).
// The docs' echo-bot example shows an underscore ("${appId}_${userId}") instead —
// that disagreement is unresolved (doc page content unavailable to verify), so this
// parser prefers the colon form we've directly observed, with underscore as a fallback
// rather than assuming either is universally correct.
export function stripSenderPrefix(prefixedSender: string, appId: string): string {
  const colonPrefix = `${appId}:`;
  if (prefixedSender.startsWith(colonPrefix)) {
    return prefixedSender.slice(colonPrefix.length);
  }
  const underscorePrefix = `${appId}_`;
  if (prefixedSender.startsWith(underscorePrefix)) {
    return prefixedSender.slice(underscorePrefix.length);
  }
  return prefixedSender; // unprefixed or unrecognized format — return as-is rather than mangle it
}