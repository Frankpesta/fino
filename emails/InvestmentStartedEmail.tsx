import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function InvestmentStartedEmail({
  planName,
  principal,
  currency,
  ratePercent,
  rateInterval,
  endsAtDate,
}: {
  planName: string;
  principal: string;
  currency: string;
  ratePercent: string;
  rateInterval: string;
  endsAtDate: string;
}) {
  return (
    <EmailLayout previewText={`You've invested in ${planName}`}>
      <Text style={styles.heading}>Investment started</Text>
      <Text style={styles.amount}>
        {principal} {currency}
      </Text>
      <Text style={styles.paragraph}>
        You&apos;ve invested in <strong>{planName}</strong> at a target rate of {ratePercent}% /{" "}
        {rateInterval}. This rate is locked in for the life of this investment.
      </Text>
      <Text style={styles.mutedText}>Term ends {endsAtDate}.</Text>
    </EmailLayout>
  );
}

export default InvestmentStartedEmail;
