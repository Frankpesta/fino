import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function PasswordResetCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout previewText={`Your password reset code is ${code}`}>
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.paragraph}>
        Enter this code to choose a new password. It expires in 15 minutes.
      </Text>
      <Text style={{ ...styles.amount, letterSpacing: 4 }}>{code}</Text>
      <Text style={styles.mutedText}>
        If you didn&apos;t request this, you can safely ignore this email -- your password
        won&apos;t change.
      </Text>
    </EmailLayout>
  );
}

export default PasswordResetCodeEmail;
