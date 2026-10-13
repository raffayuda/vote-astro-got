import { updateAdminAccount, updateAdminPassword } from "@/app/actions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireRole } from "@/lib/session";

export const metadata = { title: "Akun Admin — ASTRO Got Talent" };

export default async function AdminAccountPage() {
  const session = await requireRole("admin");

  return (
    <>
      <Card>
        <CardTitle>Profil Admin</CardTitle>
        <p className="mt-1 text-sm text-muted">Email ini dipakai untuk login di halaman admin.</p>
        <ActionForm action={updateAdminAccount} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input name="name" label="Nama" required defaultValue={session.user.name} autoComplete="off" />
          <Input
            name="email"
            label="Email"
            type="email"
            required
            defaultValue={session.user.email}
            autoComplete="off"
          />
          <SubmitButton className="self-start sm:col-span-2">Simpan Perubahan</SubmitButton>
        </ActionForm>
      </Card>

      <Card>
        <CardTitle>Ganti Password</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Minimal 8 karakter. Setelah diganti, semua perangkat yang sedang login ikut keluar dan perlu login
          ulang.
        </p>
        <ActionForm action={updateAdminPassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            name="newPassword"
            label="Password baru"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            name="confirmPassword"
            label="Konfirmasi password baru"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <SubmitButton className="self-start sm:col-span-2" variant="secondary">
            Ganti Password
          </SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
