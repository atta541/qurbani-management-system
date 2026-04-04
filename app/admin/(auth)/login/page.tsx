import { Suspense } from "react";

import { LoginWithSearchParams } from "@/app/admin/(auth)/login/login-with-search-params";

function LoginSearchParamsFallback() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 h-7 w-40 animate-pulse rounded-md bg-muted" />
      <div className="mb-4 h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="mb-6 h-10 w-full animate-pulse rounded-md bg-muted" />
      <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export default function AdminLoginPage(props: { searchParams: Promise<{ next?: string }> }) {
  return (
    <div className="flex min-h-[calc(100vh-0px)] items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Suspense fallback={<LoginSearchParamsFallback />}>
        <LoginWithSearchParams searchParamsPromise={props.searchParams} />
      </Suspense>
    </div>
  );
}
