import LoginForm from "./ui";

/**
 * Awaits `searchParams` inside a `<Suspense>` boundary (parent page) so `/admin/login` is not a
 * fully blocking route in Next.js 16+.
 */
export async function LoginWithSearchParams({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ next?: string }>;
}) {
  const searchParams = await searchParamsPromise;
  return <LoginForm next={searchParams.next} />;
}
