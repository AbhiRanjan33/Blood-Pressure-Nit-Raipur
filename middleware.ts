import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/",
  "/sign-in",
  "/sign-up",
  "/select-role",
]);

const isPatientRoute = createRouteMatcher(["/dashboard/patient(.*)"]);
const isDoctorRoute = createRouteMatcher(["/dashboard/doctor(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = auth();

  // Public routes
  if (isPublic(req)) return;

  // Must be signed in
  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  const { user } = await import("@clerk/nextjs/server");
  const clerkUser = await user();
  const role = clerkUser?.unsafeMetadata?.role as "patient" | "doctor" | undefined;

  // Role not selected → force select
  if (!role && req.nextUrl.pathname !== "/select-role") {
    return Response.redirect(new URL("/select-role", req.url));
  }

  // Protect patient routes
  if (isPatientRoute(req) && role !== "patient") {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  // Protect doctor routes
  if (isDoctorRoute(req) && role !== "doctor") {
    return Response.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};