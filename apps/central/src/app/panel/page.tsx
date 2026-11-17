import { redirect } from "next/navigation";

export default function PanelDashboardRedirect() {
  // Usuwamy stary pulpit ze statystykami
  redirect("/panel/klienci-oczekujacy");
}