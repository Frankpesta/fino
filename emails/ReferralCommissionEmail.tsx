import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function ReferralCommissionEmail({
  amount,
  currency,
  maskedReferredEmail,
}: {
  amount: string;
  currency: string;
  maskedReferredEmail: string;
}) {
  return (
    <EmailLayout previewText="You earned a referral commission">
      <Text style={styles.heading}>Referral commission earned</Text>
      <Text style={styles.amount}>
        +{amount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        {maskedReferredEmail} made a deposit that was just approved, and your commission has
        been credited to your balance.
      </Text>
    </EmailLayout>
  );
}

export default ReferralCommissionEmail;
