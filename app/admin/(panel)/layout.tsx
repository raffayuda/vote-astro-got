import { logoutAdmin } from "@/app/actions/auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireRole } from "@/lib/session";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return (
    <>
      <Navbar
        links={[
          { href: "/admin", label: "Ringkasan" },
          { href: "/admin/tim", label: "Tim" },
          { href: "/admin/penonton", label: "Penonton" },
          { href: "/admin/juri", label: "Juri" },
        ]}
        action={
          <form action={logoutAdmin}>
            <Button type="submit" variant="ghost" size="sm">Keluar</Button>
          </form>
        }
      />
      <main className="flex-1 pb-10 pt-6">
        <Container size="lg" className="flex flex-col gap-6">
          {children}
        </Container>
      </main>
      <Footer />
    </>
  );
}
