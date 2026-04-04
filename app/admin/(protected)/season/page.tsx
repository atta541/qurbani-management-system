import { redirect } from "next/navigation";

/** Default season hub → year configuration (pools & pricing will get sibling routes later). */
export default function AdminSeasonIndexPage() {
  redirect("/admin/season/years");
}
