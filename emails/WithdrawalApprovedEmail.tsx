import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function WithdrawalApprovedEmail({
  amount,
  currency,
  payoutTxHash,
}: {
  amount: string;
  currency: string;
  payoutTxHash?: string;
}) {
  return (
    <EmailLayout previewText="Your withdrawal has been approved">
      <Text style={styles.heading}>Withdrawal approved</Text>
      <Text style={styles.amount}>
        -{amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        Your withdrawal has been approved and the funds have been sent.
      </Text>
      {payoutTxHash && (
        <Text style={styles.mutedText}>
          Transaction hash: <span style={{ fontFamily: "monospace" }}>{payoutTxHash}</span>
        </Text>
      )}
    </EmailLayout>
  );
}

export default WithdrawalApprovedEmail;
