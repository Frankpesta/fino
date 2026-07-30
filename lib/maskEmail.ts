/**
 * Masks an email for display to a referrer, e.g. "jo***@example.com".
 * Keeps the first 2 characters of the local part (or all of it, if 2 chars
 * or shorter) and the full domain, since the domain alone rarely identifies
 * a specific person.
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) return email;

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 2) return `${local}***${domain}`;
  return `${local.slice(0, 2)}***${domain}`;
}
