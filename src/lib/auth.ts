import { auth } from "@clerk/nextjs/server";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function getUserRole() {
  const { userId } = auth();
  if (!userId) return null;

  // Try Clerk first
  const { user } = await import("@clerk/nextjs/server");
  const clerkUser = await user();
  let role = clerkUser?.unsafeMetadata?.role;

  if (!role) {
    // Fallback to DB
    await connectDB();
    const dbUser = await User.findOne({ clerkId: userId });
    role = dbUser?.role;
  }

  return role || null;
}

// Type-safe role check
export async function isPatient() {
  return (await getUserRole()) === "patient";
}

export async function isDoctor() {
  return (await getUserRole()) === "doctor";
}