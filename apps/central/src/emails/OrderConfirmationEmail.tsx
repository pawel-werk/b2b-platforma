import { Html, Head, Body, Container, Text, Heading, Preview, Hr } from "@react-email/components";
import * as React from "react";

interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  sumGross: number;
  paymentTerm: string;
  items: { name: string; qty: number; priceGross: number }[];
}

export default function OrderConfirmationEmail({ orderNumber, customerName, sumGross, paymentTerm, items }: OrderConfirmationProps) {
  const isPrepayment = paymentTerm === "prepayment";
  
  return (
    <Html>
      <Head />
      <Preview>Potwierdzenie zamówienia {orderNumber}</Preview>
      <Body style={{ backgroundColor: "#f6f9fc", fontFamily: "sans-serif", padding: "40px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <Heading style={{ color: "#0f172a", fontSize: "24px" }}>Dziękujemy za zamówienie!</Heading>
          <Text style={{ color: "#475569", fontSize: "16px" }}>Witaj {customerName}, Twoje zamówienie <strong>{orderNumber}</strong> zostało przyjęte do realizacji.</Text>
          
          <Hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
          
          <Heading as="h3" style={{ fontSize: "18px", color: "#0f172a" }}>Podsumowanie</Heading>
          {items.map((item, i) => (
            <Text key={i} style={{ margin: "4px 0", color: "#475569" }}>
              {item.qty}x {item.name} - {(item.priceGross / 100).toFixed(2)} PLN
            </Text>
          ))}
          <Text style={{ fontSize: "18px", fontWeight: "bold", marginTop: "16px" }}>
            Do zapłaty: {(sumGross / 100).toFixed(2)} PLN
          </Text>

          {isPrepayment && (
            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "6px", marginTop: "24px" }}>
              <Text style={{ margin: "0 0 8px", fontWeight: "bold", color: "#0f172a" }}>Dane do przelewu tradycyjnego:</Text>
              <Text style={{ margin: "4px 0", color: "#475569" }}>Odbiorca: ITALGROUP Sp. z o.o.</Text>
              <Text style={{ margin: "4px 0", color: "#475569" }}>Nr konta: 00 0000 0000 0000 0000 0000 0000</Text>
              <Text style={{ margin: "4px 0", color: "#475569" }}>Tytuł: Zamówienie {orderNumber}</Text>
            </div>
          )}
        </Container>
      </Body>
    </Html>
  );
}
