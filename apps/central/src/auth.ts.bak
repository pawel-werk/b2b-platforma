import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { staffUsers, companyUsers, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Sprawdzamy czy to Administrator (staff_users)
        const staffRes = await db.select().from(staffUsers).where(eq(staffUsers.email, email));
        if (staffRes.length > 0) {
          const user = staffRes[0];
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (isValid) {
            return { id: user.id, name: user.name, email: user.email, role: user.role };
          }
        }

        // 2. Sprawdzamy czy to Klient B2B (company_users)
        const compRes = await db.select().from(companyUsers).where(eq(companyUsers.email, email));
        if (compRes.length > 0) {
          const user = compRes[0];
          const isValid = await bcrypt.compare(password, user.passwordHash);
          
          if (isValid) {
            // Pobieramy aktualny status firmy
            const companyData = await db.select().from(companies).where(eq(companies.id, user.companyId));
            if (!companyData.length) return null;
            
            return { 
              id: user.id, 
              name: companyData[0].name, 
              email: user.email, 
              role: "company",
              companyId: user.companyId,
              companyStatus: companyData[0].status
            };
          }
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyStatus = user.companyStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.companyStatus = token.companyStatus as "pending" | "active" | "blocked" | "rejected";
      }
      return session;
    }
  },
  pages: {
    signIn: "/b2b/logowanie",
  }
});
