"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectTo({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const target = useMemo(() => searchParams.get("redirect") || "/", [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignedIn>
        <RedirectTo to={target} />
      </SignedIn>
      <SignedOut>
        <SignIn afterSignInUrl={target} afterSignUpUrl={target} />
      </SignedOut>
    </div>
  );
}
