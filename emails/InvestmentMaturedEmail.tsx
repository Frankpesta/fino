import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function InvestmentMaturedEmail({
  planName,
  payoutAmount,
  currency,
}: {
  planName: string;
  payoutAmount: string;
  currency: string;
}) {
  return (
    <EmailLayout previewText={`Your investment in ${planName} has matured`}>
      <Text style={styles.heading}>Investment matured</Text>
      <Text style={styles.amount}>
        +{payoutAmount} {currency}
      </Text>
      <Text style={styles.paragraph}>
        Your investment in <strong>{planName}</strong> has reached the end of its term. The
        payout above has been credited to your balance.
      </Text>
    </EmailLayout>
  );
}

export default InvestmentMaturedEmail;
