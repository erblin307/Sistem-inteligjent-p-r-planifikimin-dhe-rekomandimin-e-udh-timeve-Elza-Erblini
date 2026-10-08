import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/travel/empty-state";
import { PageHeader } from "@/components/travel/page-header";

export const metadata: Metadata = { title: "Saved places" };

export default function SavedPage() {
  return (
    <PageContainer className="flex flex-col gap-12">
      <PageHeader title="Saved places" description="Keep hotels and activities you want to revisit." />
      <EmptyState
        title="No saved places yet"
        description="Save a hotel or activity while reviewing a trip and it will appear here."
        action={<Button asChild variant="secondary"><Link href="/trips">Open my trips</Link></Button>}
      />
    </PageContainer>
  );
}
