import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function AdminMessageEmail({ subject, message }: { subject: string; message: string }) {
  const paragraphs = message.split(/\n+/).filter((p) => p.trim().length > 0);

  return (
    <EmailLayout previewText={subject}>
      <Text style={styles.heading}>{subject}</Text>
      {paragraphs.map((paragraph, i) => (
        <Text key={i} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
      <Text style={styles.mutedText}>This message was sent to you by the Fino team.</Text>
    </EmailLayout>
  );
}

export default AdminMessageEmail;
