import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function WithdrawalSubmittedEmail({
  amount,
  currency,
}: {
  amount: string;
  currency: string;
}) {
  return (
    <EmailLayout previewText="Your withdrawal request has been received">
      <Text style={styles.heading}>Withdrawal request received</Text>
      <Text style={styles.amount}>
        {amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        This amount has been reserved from your available balance and is pending admin review.
        It will only be deducted once approved.
      </Text>
    </EmailLayout>
  );
}

export default WithdrawalSubmittedEmail;
