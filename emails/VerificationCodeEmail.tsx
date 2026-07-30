import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function VerificationCodeEmail({ code }: { code: string }) {
  return (
    <EmailLayout previewText={`Your verification code is ${code}`}>
      <Text style={styles.heading}>Verify your email</Text>
      <Text style={styles.paragraph}>
        Enter this code to finish setting up your account. It expires in 15 minutes.
      </Text>
      <Text style={{ ...styles.amount, letterSpacing: 4 }}>{code}</Text>
      <Text style={styles.mutedText}>
        If you didn&apos;t request this, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default VerificationCodeEmail;
