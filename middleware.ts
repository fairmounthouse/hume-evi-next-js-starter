import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/api/webhooks(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/interview(.*)",
  "/sessions(.*)",
  "/usage(.*)",
  "/premium(.*)",
  "/premium-analytics(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();
    
    // Local redirects only; do not attempt cross-domain logic here
    if (req.nextUrl.pathname === "/") {
      if (userId) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Protect all authenticated routes
    if (isProtectedRoute(req)) {
      await auth.protect();
      return;
    }
  } catch {
    // Failsafe to avoid middleware crashes in production
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
