import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function ContactMessageEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return (
    <EmailLayout previewText={`New contact message: ${subject}`}>
      <Text style={styles.heading}>New message from the Contact page</Text>
      <Text style={styles.paragraph}>
        <strong>From:</strong> {name} ({email})
        <br />
        <strong>Subject:</strong> {subject}
      </Text>
      <Text style={styles.paragraph}>{message}</Text>
    </EmailLayout>
  );
}

export default ContactMessageEmail;
