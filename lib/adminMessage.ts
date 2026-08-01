// Validation for admin-composed emails sent from the admin dashboard
// (broadcast or single-recipient), kept separate from convex/adminMessages.ts
// so it's directly unit-testable -- same split as lib/contactMessage.ts.
export const ADMIN_MESSAGE_LIMITS = {
  subject: 150,
  message: 5000,
};

export function validateAdminMessage(fields: { subject: string; message: string }): void {
  const { subject, message } = fields;

  if (subject.trim().length === 0) throw new Error("Subject is required");
  if (subject.length > ADMIN_MESSAGE_LIMITS.subject) throw new Error("Subject is too long");

  if (message.trim().length < 10) {
    throw new Error("Message must be at least 10 characters");
  }
  if (message.length > ADMIN_MESSAGE_LIMITS.message) throw new Error("Message is too long");
}
