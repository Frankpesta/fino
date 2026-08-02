import { Html, Head, Preview, Body, Container, Section, Text, Hr, Link, Img } from "@react-email/components";
import type { ReactNode } from "react";
import * as styles from "../styles";

const APP_URL = process.env.SITE_URL ?? "http://localhost:3000";
// Real-venture placeholder until real support details are configured -- see
// docs note on real-venture placeholders (matches the pattern used for
// platform wallets / plan terms elsewhere in this build).
const SUPPORT_CONTACT = process.env.RESEND_SUPPORT_CONTACT ?? "support@zypherex.com";

export function EmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Img src={`${APP_URL}/logo.png`} width="72" height="72" alt="Zypherex" style={styles.logo} />
          {children}
          <Hr style={styles.hr} />
          <Section>
            <Text style={styles.footer}>
              Questions? Contact us at {SUPPORT_CONTACT}.
              <br />
              <Link href={`${APP_URL}/profile`} style={styles.footerLink}>
                Manage notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
