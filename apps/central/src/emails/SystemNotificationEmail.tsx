import { Html, Head, Body, Container, Text, Heading, Preview } from "@react-email/components";
import * as React from "react";

interface SystemNotificationProps {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}

export default function SystemNotificationEmail({ title, message, actionText, actionUrl }: SystemNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif", padding: "40px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <Heading style={{ color: "#0f172a", fontSize: "24px", marginTop: "0" }}>{title}</Heading>
          <Text style={{ color: "#475569", fontSize: "16px", lineHeight: "24px", whiteSpace: "pre-wrap" }}>
            {message}
          </Text>
          {actionText && actionUrl && (
            <a href={actionUrl} style={{ display: "inline-block", backgroundColor: "#000", color: "#fff", padding: "12px 24px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold", marginTop: "16px" }}>
              {actionText}
            </a>
          )}
        </Container>
      </Body>
    </Html>
  );
}
