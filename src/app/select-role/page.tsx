"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stethoscope, User } from "lucide-react";

export default function SelectRole() {
  const { user } = useClerk(); // Removed setActive (not needed)
  const router = useRouter();

  const assignRole = async (role: "patient" | "doctor") => {
    if (!user) {
      console.error('No user found');
      return;
    }

    try {
      // Step 1: Update Clerk metadata
      await user.update({
        unsafeMetadata: { role },
      });

      // Step 2: Sync to MongoDB via API
      const response = await fetch('/api/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      // Redirect
      // Inside assignRole function, after sync
if (role === "patient") {
  router.push("/patient-form"); // NEW PAGE
} else {
  router.push("/dashboard/doctor");
}
    } catch (err) {
      console.error('Error assigning role:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Choose Your Role</h1>
        <p className="text-center text-gray-600 mb-8">
          How will you use BP Health AI?
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => assignRole("patient")}
            className="w-full h-16 text-lg"
            variant="outline"
          >
            <User className="mr-3 h-6 w-6" />
            I am a <span className="font-semibold ml-1">Patient</span>
          </Button>

          <Button
            onClick={() => assignRole("doctor")}
            className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
          >
            <Stethoscope className="mr-3 h-6 w-6" />
            I am a <span className="font-semibold ml-1">Doctor</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}