import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const hasError = searchParams?.error === "CredentialsSignin";

  return (
    <div className="max-w-sm mx-auto mt-20 bg-white p-8 rounded-lg shadow-sm border">
      <h1 className="text-2xl font-bold mb-6 text-center">Logowanie do panelu</h1>
      
      {hasError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
          Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.
        </div>
      )}

      <form action={async (formData) => {
        "use server";
        try {
          await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/panel"
          });
        } catch (error) {
          if (error instanceof AuthError) {
            redirect("/panel/logowanie?error=CredentialsSignin");
          }
          // Sukces logowania rzuca w Next.js błędem przekierowania, musimy go przepuścić
          throw error; 
        }
      }} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <input name="email" type="email" required className="w-full border rounded p-2" defaultValue="admin@centrala.example.test" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hasło</label>
          <input name="password" type="password" required className="w-full border rounded p-2" defaultValue="admin123" />
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition mt-2">
          Zaloguj się
        </button>
      </form>
    </div>
  );
}