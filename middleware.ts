import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/", // Landing page
  "/pricing", // Public pricing page
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/api/webhooks(.*)", // Webhook endpoints
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
  const { userId } = await auth();
  
  // Note: User sync is now handled by components to avoid redundant calls
  // Middleware only handles routing logic
  
  // If user is authenticated and trying to access root, redirect to dashboard
  if (userId && req.nextUrl.pathname === "/") {
    return Response.redirect(new URL("/dashboard", req.url));
  }
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
    return Response.redirect(new URL("/dashboard", req.url));
  }
  
  // Protect all authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
    return;
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
