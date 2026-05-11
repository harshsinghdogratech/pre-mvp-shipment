import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="client">
      <AppShell role="client">{children}</AppShell>
    </AuthGuard>
  );
}
