import Link from "next/link";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/travel/empty-state";

export default function TripNotFound() {
  return (
    <PageContainer className="flex flex-col gap-12">
      <EmptyState
        title="Trip not found"
        description="This trip doesn't exist or is no longer available."
        action={
          <Button asChild variant="secondary">
            <Link href="/trips">Back to my trips</Link>
          </Button>
        }
      />
    </PageContainer>
  );
}
