import { redirect } from "next/navigation";

export default function RetentionsRedirect() {
  redirect("/dashboard/retention/deployed");
}
