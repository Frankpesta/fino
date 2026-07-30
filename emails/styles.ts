import type { CSSProperties } from "react";

// Email-safe inline styles only -- no Tailwind classes, since many clients
// strip <style> tags / class-based CSS. Explicit background + text colors on
// every element (never left to default/transparent) is the standard
// mitigation for clients that auto-invert colors in dark mode.
//
// Light background by design: transactional email dark-mode support is
// wildly inconsistent across clients (Gmail/Outlook/Apple Mail all differ),
// so a light, high-contrast design that stays readable if a client forces
// its own dark transform is safer than trying to ship a true dark theme.

export const colors = {
  background: "#f4f5f7",
  card: "#ffffff",
  border: "#e2e4ea",
  text: "#1a1d29",
  muted: "#6b7280",
  primary: "#4f39f6",
  primaryText: "#ffffff",
  success: "#16794f",
  destructive: "#c0392b",
};

export const body: CSSProperties = {
  backgroundColor: colors.background,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  margin: 0,
  padding: 0,
};

export const container: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  margin: "32px auto",
  maxWidth: 480,
  padding: "32px 32px 24px",
};

export const brand: CSSProperties = {
  color: colors.primary,
  fontSize: 20,
  fontWeight: 700,
  margin: "0 0 24px",
};

export const heading: CSSProperties = {
  color: colors.text,
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.3,
  margin: "0 0 16px",
};

export const paragraph: CSSProperties = {
  color: colors.text,
  fontSize: 15,
  lineHeight: 1.6,
  margin: "0 0 16px",
};

export const mutedText: CSSProperties = {
  color: colors.muted,
  fontSize: 13,
  lineHeight: 1.5,
  margin: "0 0 16px",
};

export const amount: CSSProperties = {
  color: colors.text,
  fontSize: 28,
  fontWeight: 700,
  margin: "0 0 24px",
};

export const button: CSSProperties = {
  backgroundColor: colors.primary,
  borderRadius: 8,
  color: colors.primaryText,
  display: "inline-block",
  fontSize: 15,
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};

export const hr: CSSProperties = {
  borderColor: colors.border,
  margin: "24px 0",
};

export const footer: CSSProperties = {
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.6,
  margin: 0,
};

export const footerLink: CSSProperties = {
  color: colors.muted,
  textDecoration: "underline",
};
