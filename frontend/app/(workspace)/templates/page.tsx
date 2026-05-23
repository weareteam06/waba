import { Suspense } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { TemplateManagementPage } from "@/src/features/templates/template-management-page";

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesFallback />}>
      <TemplateManagementPage />
    </Suspense>
  );
}

function TemplatesFallback() {
  return (
    <main className="grid min-h-[calc(100dvh-4rem)] gap-4 bg-[#0F172A] p-4 xl:grid-cols-[340px_minmax(0,1fr)_390px]">
      <Skeleton className="rounded-lg" />
      <Skeleton className="rounded-lg" />
      <Skeleton className="rounded-lg" />
    </main>
  );
}
