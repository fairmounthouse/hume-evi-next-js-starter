import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootRedirectPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  redirect("/sign-in");
}