import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAuthPage = createRouteMatcher(["/sign-in", "/sign-up"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isUserRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/deposits(.*)",
  "/withdrawals(.*)",
  "/profile(.*)",
  "/referrals(.*)",
]);

// Middleware only enforces the coarse "must be signed in" gate (this
// package's middleware context exposes just `isAuthenticated`/`getToken`,
// not a query client). The fine-grained checks -- role === "admin" for
// /admin, emailVerified === true for user routes -- run server-side in each
// route group's layout.tsx via `fetchQuery`, and are re-checked again inside
// every mutation/query itself (convex/model/authz.ts). See
// docs/02-phase-1-foundations.md 1.2: "never trust a client-side role check
// alone" -- the same principle extends to middleware, which is still just
// routing, not the authorization boundary.
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authenticated = await convexAuth.isAuthenticated();

  if (isAuthPage(request) && authenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  if ((isAdminRoute(request) || isUserRoute(request)) && !authenticated) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
