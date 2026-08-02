import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

const APP_URL = process.env.SITE_URL ?? "http://localhost:3000";

export function WelcomeEmail() {
  return (
    <EmailLayout previewText="Your email is verified -- welcome to Zypherex">
      <Text style={styles.heading}>You&apos;re verified</Text>
      <Text style={styles.paragraph}>
        Your account is ready. Make a deposit or browse investment plans to get started.
      </Text>
      <Button href={`${APP_URL}/dashboard`} style={styles.button}>
        Go to your dashboard
      </Button>
    </EmailLayout>
  );
}

export default WelcomeEmail;
