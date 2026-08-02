import { LegalPageLayout } from "@/components/legal-page-layout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="[date]">
      <section>
        <h2>1. Acceptance of terms</h2>
        <p>
          By creating an account or using [Company Legal Name] (&quot;Zypherex,&quot; &quot;we,&quot;
          &quot;us&quot;) you agree to these Terms of Service. If you do not agree, do not use
          the service.
        </p>
      </section>

      <section>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years old and legally able to enter into a binding contract in
          your jurisdiction to use this service. You represent that your use of the service
          complies with all laws applicable to you, including those governing cryptocurrency and
          investment activity in your jurisdiction.
        </p>
      </section>

      <section>
        <h2>3. Risk disclosure</h2>
        <p>
          Investing in cryptocurrency carries substantial risk, including the risk of losing your
          entire principal. Target rates shown on investment plans are not guarantees --
          returns depend on trading performance and are not promised or assured. Past performance
          does not indicate future results. Only invest funds you can afford to lose.
        </p>
      </section>

      <section>
        <h2>4. Account registration</h2>
        <p>
          You&apos;re responsible for maintaining the confidentiality of your account credentials
          and for all activity under your account. Notify us immediately of any unauthorized use.
        </p>
      </section>

      <section>
        <h2>5. Deposits and withdrawals</h2>
        <p>
          Deposits are credited to your account only after manual review and approval. Withdrawal
          requests are reviewed before funds are released and may be delayed, requested for
          additional verification, or declined at our discretion, including for suspected fraud
          or violation of these terms.
        </p>
      </section>

      <section>
        <h2>6. Prohibited use</h2>
        <p>
          You may not use the service for money laundering, terrorist financing, fraud, or any
          unlawful purpose, or attempt to circumvent our security, verification, or compliance
          controls.
        </p>
      </section>

      <section>
        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, [Company Legal Name] is not liable for indirect,
          incidental, or consequential damages arising from your use of the service, including
          losses from market volatility, trading performance, or third-party actions.
        </p>
      </section>

      <section>
        <h2>8. Termination</h2>
        <p>
          We may suspend or terminate your account for violation of these terms, suspected
          fraud, or as required by law. You may request account closure at any time through your
          profile settings, subject to admin review.
        </p>
      </section>

      <section>
        <h2>9. Changes to these terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after changes
          take effect constitutes acceptance of the revised terms.
        </p>
      </section>

      <section>
        <h2>10. Governing law</h2>
        <p>These terms are governed by the laws of [Jurisdiction].</p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>Questions about these terms can be sent to [support email].</p>
      </section>
    </LegalPageLayout>
  );
}
