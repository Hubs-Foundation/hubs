export default function maskEmail(email) {
  if (!email) return "";
  const emailParts = email.split("@");
  const emailIdentity = emailParts[0];
  const emailDomain = emailParts[1];
  const truncatedIdentity = emailIdentity.substring(0, Math.min(emailIdentity.length, 3));
  return `${truncatedIdentity}...@${emailDomain}`;
}
