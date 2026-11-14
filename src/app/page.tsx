import { redirect } from "next/navigation";

export default function Home() {
  // Przekierowuje ruch z głównej domeny od razu na widok siatki produktów
  redirect("/shop");
}