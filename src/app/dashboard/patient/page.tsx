// src/app/dashboard/patient/page.tsx
"use client";

import { useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Activity, User } from "lucide-react";

import BPEntryForm from "@/components/patient/BPEntryForm";
import BPChartCard from "@/components/patient/BPChartCard";
import BPCommentsTable from "@/components/patient/BPCommentsTable";
import GoogleFitActivityCard from "@/components/patient/GoogleFitActivityCard";
import PatientProfileCard from "@/components/patient/PatientProfileCard";
import HeartRiskChecker from "@/components/patient/HeartRiskChecker";
import ConsultDoctorForm from "@/components/patient/ConsultDoctorForm"; // ← NEW
import ConsultationHistoryCard from "@/components/patient/ConsultationHistoryCard";

export default function PatientDashboard() {
  const { user } = useUser();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="text-red-500" /> Patient Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>

            {user?.imageUrl && (
              <button
                onClick={() => setShowProfile(true)}
                className="rounded-full overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
              >
                <img
                  src={user.imageUrl}
                  alt="Profile"
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
          {/* BP Entry */}
          <Card className="p-6">
            <Activity className="h-10 w-10 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold">Track BP</h2>
            <p className="text-gray-600">Connect device or enter manually</p>
            <BPEntryForm />
          </Card>

          {/* CONSULT DOCTOR CARD + MODAL */}
          <Card>
            <ConsultDoctorForm />
          </Card>

          <BPChartCard />
          <BPCommentsTable />
          <GoogleFitActivityCard />
          <HeartRiskChecker />
          <ConsultationHistoryCard/>
        </div>
      </div>

      <PatientProfileCard open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}