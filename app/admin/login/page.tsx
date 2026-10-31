import { redirect } from "next/navigation";
import { adminLogin } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { LoginCard } from "@/components/login-card";
import { BrandLogo } from "@/components/brand-logo";
import { Container } from "@/components/ui/container";
import { getSessionFor } from "@/lib/session";

export const metadata = { title: "Login Panitia — ASTRO Got Talent" };

export default async function AdminLoginPage() {
  if (await getSessionFor("admin")) redirect("/admin");
  return (
    <>
      <main className="flex flex-1 flex-col justify-center py-10">
        <Container size="sm" className="flex flex-col items-center gap-4">
          <BrandLogo height={72} priority />
          <LoginCard
            title="Login Panitia"
            description="Khusus panitia / IT support."
            action={adminLogin}
            submitLabel="Masuk"
            fields={[
              { name: "email", label: "Email", type: "email", autoComplete: "username", inputMode: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
