import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { PageHeader, SectionHeader } from "@/components/travel/page-header";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <PageContainer width="form" className="flex flex-col gap-12">
      <PageHeader title="Profile" description="Manage your travel preferences and account defaults." />
      <section className="flex flex-col gap-4">
        <SectionHeader title="Travel preferences" />
        <p className="border-y py-6 type-body text-muted-foreground">
          Currency, home city, pace and dietary preferences will appear here when profile settings are connected.
        </p>
      </section>
    </PageContainer>
  );
}
