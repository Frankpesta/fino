import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function WithdrawalRejectedEmail({
  amount,
  currency,
  reason,
}: {
  amount: string;
  currency: string;
  reason: string;
}) {
  return (
    <EmailLayout previewText="Your withdrawal request was rejected">
      <Text style={styles.heading}>Withdrawal rejected</Text>
      <Text style={styles.amount}>
        {amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        Your withdrawal request wasn&apos;t approved for the following reason. No funds were
        deducted from your balance.
      </Text>
      <Text style={{ ...styles.paragraph, color: styles.colors.destructive }}>{reason}</Text>
    </EmailLayout>
  );
}

export default WithdrawalRejectedEmail;
