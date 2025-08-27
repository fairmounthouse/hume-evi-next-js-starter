// Simple middleware for landing site - no authentication needed
// All CTAs should redirect to app.skillflo.ai
export function middleware() {
  // No middleware logic needed for landing site
  // All authentication is handled by app.skillflo.ai
  return;
}

export const config = {
  matcher: [
    // Skip all files and API routes - landing site is purely static
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
