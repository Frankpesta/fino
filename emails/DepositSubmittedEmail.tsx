import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function DepositSubmittedEmail({
  amount,
  currency,
}: {
  amount: string;
  currency: string;
}) {
  return (
    <EmailLayout previewText="We've received your deposit request">
      <Text style={styles.heading}>Deposit request received</Text>
      <Text style={styles.amount}>
        {amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        We&apos;ve received your deposit request and it&apos;s pending review. You&apos;ll get
        another email once it&apos;s approved.
      </Text>
    </EmailLayout>
  );
}

export default DepositSubmittedEmail;
