import { Text, Button } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

const APP_URL = process.env.SITE_URL ?? "http://localhost:3000";

export function DepositApprovedEmail({
  amount,
  currency,
  newBalance,
}: {
  amount: string;
  currency: string;
  newBalance: string;
}) {
  return (
    <EmailLayout previewText="Your deposit has been approved">
      <Text style={styles.heading}>Deposit approved</Text>
      <Text style={styles.amount}>
        +{amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        Your deposit has been credited. Your new {currency} balance is {newBalance}.
      </Text>
      <Button href={`${APP_URL}/dashboard`} style={styles.button}>
        View dashboard
      </Button>
    </EmailLayout>
  );
}

export default DepositApprovedEmail;
