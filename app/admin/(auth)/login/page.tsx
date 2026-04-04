import Image from "next/image";
import { Suspense } from "react";

import { LoginWithSearchParams } from "@/app/admin/(auth)/login/login-with-search-params";

function LoginSearchParamsFallback() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted" />
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-full max-w-xs animate-pulse rounded-md bg-muted" />
      <div className="space-y-4 pt-2">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default function AdminLoginPage(props: { searchParams: Promise<{ next?: string }> }) {
  return (
    <div className="grid min-h-svh w-full grid-cols-1 lg:grid-cols-2">
      {/* Brand panel — full image visible (letterboxed); no top/bottom crop */}
      <div className="relative flex min-h-[min(42vh,320px)] w-full items-center justify-center bg-muted lg:min-h-svh">
        <Image
          src="/images/login-left-image.jpeg"
          alt=""
          fill
          className="object-contain object-center"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-background px-6 py-10 sm:px-10 lg:min-h-svh lg:px-16 xl:px-20">
        <Suspense fallback={<LoginSearchParamsFallback />}>
          <LoginWithSearchParams searchParamsPromise={props.searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
