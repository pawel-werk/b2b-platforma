import { auth } from "@/auth";
import { B2BLayoutClient } from "@/components/b2b/B2BLayoutClient";

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <B2BLayoutClient
      companyId={session?.user?.companyId || "temp"}
      companyName={session?.user?.name || "Moja Firma"}
    >
      {children}
    </B2BLayoutClient>
  );
}
