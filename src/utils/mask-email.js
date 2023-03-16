export default function maskEmail(email) {
  if (!email) return "";
  const emailParts = email.split("@");
  const emailIdentity = emailParts[0];
  const emailDomain = emailParts[1];
  if(emailDomain) {
    return `${emailIdentity.substring(0, Math.min(emailIdentity.length, 3))}...@${emailDomain}`
  } else {
    return emailIdentity.length > 15 ? `${emailIdentity.substring(0, 15)}...` : emailIdentity;
  }
}
