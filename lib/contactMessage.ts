// Pure validation for the public marketing-site "Contact us" form, kept
// separate from convex/contact.ts so it's directly unit-testable. Input is
// unauthenticated and untrusted -- caps exist to bound what lands in the
// database and in an admin's inbox, not to be a full spam filter.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT_MESSAGE_LIMITS = {
  name: 100,
  email: 200,
  subject: 150,
  message: 4000,
};

export function validateContactMessage(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): void {
  const { name, email, subject, message } = fields;

  if (name.trim().length === 0) throw new Error("Name is required");
  if (name.length > CONTACT_MESSAGE_LIMITS.name) throw new Error("Name is too long");

  if (!EMAIL_SHAPE.test(email) || email.length > CONTACT_MESSAGE_LIMITS.email) {
    throw new Error("A valid email address is required");
  }

  if (subject.trim().length === 0) throw new Error("Subject is required");
  if (subject.length > CONTACT_MESSAGE_LIMITS.subject) throw new Error("Subject is too long");

  if (message.trim().length < 10) {
    throw new Error("Message must be at least 10 characters");
  }
  if (message.length > CONTACT_MESSAGE_LIMITS.message) throw new Error("Message is too long");
}
