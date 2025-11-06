// src/app/dashboard/doctor/page.tsx
"use client";

import { useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stethoscope, FileCheck, Activity, User } from "lucide-react";

import DoctorProfileCard from "@/components/doctor/DoctorProfileCard";

export default function DoctorDashboard() {
  const { user } = useUser();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="text-blue-600" /> Doctor Dashboard
          </h1>
          <div className="flex items-center gap-3">
            {/* PROFILE BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>

            {/* PHOTO BUTTON */}
            {user?.imageUrl && (
              <button
                onClick={() => setShowProfile(true)}
                className="rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
              >
                <img
                  src={user.imageUrl}
                  alt="Doctor"
                  className="h-10 w-10 rounded-full object-cover"
                />
              </button>
            )}

            <SignOutButton>
              <Button variant="outline" size="sm">Sign Out</Button>
            </SignOutButton>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <FileCheck className="h-10 w-10 text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold">Review AI Suggestions</h2>
            <p className="text-gray-600">Approve or modify prescriptions</p>
            <Button className="mt-4 w-full">View Queue (3)</Button>
          </Card>

          <Card className="p-6">
            <Activity className="h-10 w-10 text-teal-600 mb-4" />
            <h2 className="text-xl font-semibold">Patient Trends</h2>
            <p className="text-gray-600">Monitor BP patterns over time</p>
            <Button variant="outline" className="mt-4 w-full">View Patients</Button>
          </Card>
        </div>
      </div>

      {/* PROFILE MODAL */}
      <DoctorProfileCard open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}