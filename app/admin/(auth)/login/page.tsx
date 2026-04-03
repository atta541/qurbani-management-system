import LoginForm from "./ui";

export default async function AdminLoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-[calc(100vh-0px)] flex items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <LoginForm next={searchParams.next} />
    </div>
  );
}

