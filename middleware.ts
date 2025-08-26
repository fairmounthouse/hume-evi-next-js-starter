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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const reqHost = req.nextUrl.host;
  const appHost = appUrl ? new URL(appUrl).host : null;
  
  // Note: User sync is now handled by components to avoid redundant calls
  // Middleware only handles routing logic
  
  // Cross-domain routing: if on landing domain (host !== app host)
  if (appHost && reqHost !== appHost) {
    // Redirect any auth routes to the app domain auth
    if (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up")) {
      return Response.redirect(`${appUrl}${req.nextUrl.pathname}${req.nextUrl.search}`);
    }
    // If authenticated and on landing root, send to app dashboard
    if (userId && req.nextUrl.pathname === "/") {
      return Response.redirect(`${appUrl}/dashboard`);
    }
  } else {
    // On app domain: local redirects
    if (userId && req.nextUrl.pathname === "/") {
      return Response.redirect(new URL("/dashboard", req.url));
    }
    if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
      return Response.redirect(new URL("/dashboard", req.url));
    }
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
