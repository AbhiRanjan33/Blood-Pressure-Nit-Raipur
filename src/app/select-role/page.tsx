"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stethoscope, User } from "lucide-react";

export default function SelectRole() {
  const { user } = useClerk();
  const router = useRouter();

  const assignRole = async (role: "patient" | "doctor") => {
    if (!user) {
      console.error("No user found");
      return;
    }

    try {
      // Step 1: Update Clerk metadata
      await user.update({
        unsafeMetadata: { role },
      });

      // Step 2: Sync to MongoDB via API
      const response = await fetch("/api/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      // Redirect based on role
      if (role === "patient") {
        router.push("/patient-form");
      } else {
        router.push("/doctor-profile");
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/pod.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Semi-transparent overlay for readability */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-0" />

      <div className="relative z-10 w-full max-w-md">
        <Card className="p-8 shadow-2xl bg-white/95 backdrop-blur-md border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Choose Your Role</h1>
          <p className="text-center text-gray-600 mb-8">
            How will you use BP Health AI?
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => assignRole("patient")}
              className="w-full h-16 text-lg border-red-300 text-red-900 hover:bg-red-50"
              variant="outline"
            >
              <User className="mr-3 h-6 w-6" />
              I am a <span className="font-semibold ml-1">Patient</span>
            </Button>

            <Button
              onClick={() => assignRole("doctor")}
              className="w-full h-16 text-lg bg-red-900 hover:bg-red-800 text-white"
            >
              <Stethoscope className="mr-3 h-6 w-6" />
              I am a <span className="font-semibold ml-1">Doctor</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}