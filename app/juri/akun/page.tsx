import { logoutJudge } from "@/app/actions/auth";
import { updateJudgePassword } from "@/app/actions/judge";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ActionForm } from "@/components/ui/action-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Akun Juri & Ganti Password — ASTRO Got Talent" };

export default async function JudgeAccountPage() {
  const session = await requireRole("judge");

  return (
    <>
      <Navbar
        size="md"
        links={[
          { href: "/juri", label: "Penilaian" },
          { href: "/juri/akun", label: "Ganti Password" },
        ]}
        action={
          <form action={logoutJudge}>
            <Button type="submit" variant="ghost" size="sm">
              Keluar
            </Button>
          </form>
        }
      />
      <main className="flex-1 pb-10 pt-6">
        <Container size="md" className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-extrabold text-astro-navy">Pengaturan Akun Juri</h1>
              <p className="text-sm text-muted">Kelola akun dan ganti kata sandi login Anda.</p>
            </div>
            <ButtonLink href="/juri" variant="secondary" size="sm">
              ← Kembali ke Penilaian
            </ButtonLink>
          </div>

          <Card>
            <CardTitle>Profil Juri</CardTitle>
            <div className="mt-3 flex flex-col gap-1 text-sm">
              <p>
                <strong className="text-astro-navy">Nama:</strong> {session.user.name}
              </p>
              <p>
                <strong className="text-astro-navy">Email:</strong> {session.user.email}
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>Ganti Password</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Masukkan password saat ini dan buat password baru minimal 8 karakter.
            </p>
            <ActionForm action={updateJudgePassword} className="mt-4 flex flex-col gap-4">
              <Input
                name="currentPassword"
                label="Password Saat Ini"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password yang Anda gunakan saat ini..."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="newPassword"
                  label="Password Baru"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter..."
                />
                <Input
                  name="confirmPassword"
                  label="Konfirmasi Password Baru"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Ulangi password baru..."
                />
              </div>
              <SubmitButton className="self-start" variant="primary">
                Simpan Password Baru
              </SubmitButton>
            </ActionForm>
          </Card>
        </Container>
      </main>
      <Footer />
    </>
  );
}

