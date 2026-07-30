import { Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import * as styles from "./styles";

export function CronFailureAlertEmail({
  cronName,
  errorCount,
  firstError,
}: {
  cronName: string;
  errorCount: number;
  firstError: string;
}) {
  return (
    <EmailLayout previewText={`${cronName} failed for ${errorCount} record(s)`}>
      <Text style={styles.heading}>Cron job failure: {cronName}</Text>
      <Text style={styles.paragraph}>
        {errorCount} record{errorCount === 1 ? "" : "s"} failed to process and were skipped this
        run. Other records processed normally. This can indicate a direct financial discrepancy
        (accrual not paid, term not finalized) -- check the Convex dashboard logs for {cronName}.
      </Text>
      <Text style={{ ...styles.paragraph, color: styles.colors.destructive }}>{firstError}</Text>
    </EmailLayout>
  );
}

export default CronFailureAlertEmail;
