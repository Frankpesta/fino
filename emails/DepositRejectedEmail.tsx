import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function DepositRejectedEmail({
  amount,
  currency,
  reason,
}: {
  amount: string;
  currency: string;
  reason: string;
}) {
  return (
    <EmailLayout previewText="Your deposit request was rejected">
      <Text style={styles.heading}>Deposit rejected</Text>
      <Text style={styles.amount}>
        {amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        Your deposit request wasn&apos;t approved for the following reason:
      </Text>
      <Text style={{ ...styles.paragraph, color: styles.colors.destructive }}>{reason}</Text>
      <Text style={styles.mutedText}>
        If you believe this is a mistake, please contact support.
      </Text>
    </EmailLayout>
  );
}

export default DepositRejectedEmail;
