import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function SecurityNoticeEmail({ message }: { message: string }) {
  return (
    <EmailLayout previewText="Security notice for your account">
      <Text style={styles.heading}>Security notice</Text>
      <Text style={styles.paragraph}>{message}</Text>
      <Text style={styles.mutedText}>
        If this wasn&apos;t you, contact support immediately.
      </Text>
    </EmailLayout>
  );
}

export default SecurityNoticeEmail;
