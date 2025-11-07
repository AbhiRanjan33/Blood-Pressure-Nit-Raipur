// src/app/dashboard/patient/page.tsx
"use client";

import { useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Activity, User, AlertTriangle, Siren, MessageCircle } from "lucide-react";

import BPEntryForm from "@/components/patient/BPEntryForm";
import BPChartCard from "@/components/patient/BPChartCard";
import BPCommentsTable from "@/components/patient/BPCommentsTable";
import GoogleFitActivityCard from "@/components/patient/GoogleFitActivityCard";
import PatientProfileCard from "@/components/patient/PatientProfileCard";
import HeartRiskChecker from "@/components/patient/HeartRiskChecker";
import ConsultDoctorForm from "@/components/patient/ConsultDoctorForm";
import RecentConsultations from "@/components/patient/RecentConsultation";
import CompletedPrescriptions from "@/components/patient/CompletedPrescription";
import NearestHospital from "@/components/patient/NearestHospital";
import EmergencyContactsCard from "@/components/patient/EmergencyContactsCard";
import Link from "next/link";

export default function PatientDashboard() {
  const { user } = useUser();
  const [showProfile, setShowProfile] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const triggerSOS = async () => {
    if (!user?.id || sosLoading) return;

    setSosLoading(true);

    try {
      const res = await fetch("/api/trigger-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });

      const data = await res.json();

      if (data.success) {
        alert("SOS ALERT SENT! Your emergency contacts are being called RIGHT NOW!");
      } else {
        alert("SOS Failed: " + (data.error || "Try again"));
      }
    } catch (err) {
      alert("SOS Failed — Is your Flask server running on port 5001?");
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="text-red-500" /> Patient Dashboard
          </h1>
          <div className="flex items-center gap-3">
            {/* SOS BUTTON — LEFT OF VIEW PROFILE */}
            <Button
              onClick={triggerSOS}
              disabled={sosLoading}
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold text-lg shadow-2xl animate-pulse border-2 border-red-300"
              size="sm"
            >
              {sosLoading ? (
                <>
                  <Siren className="h-6 w-6 mr-2 animate-spin" />
                  CALLING...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 mr-2" />
                  SOS EMERGENCY
                </>
              )}
            </Button>


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

            {/* ← NEW: CHATBOT BUTTON */}
  <Link href="/chatbot">
    <Button variant="outline" size="sm" className="flex items-center gap-2 border-red-300 text-red-900 hover:bg-red-50">
      <MessageCircle className="h-4 w-4" />
      AI Chat
    </Button>
  </Link>

            <SignOutButton>
              <Button variant="outline" size="sm">Sign Out</Button>
            </SignOutButton>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <Activity className="h-10 w-10 text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold">Track BP</h2>
            <p className="text-gray-600">Connect device or enter manually</p>
            <BPEntryForm />
          </Card>

          <Card>
            <ConsultDoctorForm />
          </Card>

          <BPChartCard />
          <BPCommentsTable />
          <GoogleFitActivityCard />
          <HeartRiskChecker />
          <RecentConsultations />
          <CompletedPrescriptions />
          <NearestHospital />
          <EmergencyContactsCard />
        </div>
      </div>

      <PatientProfileCard open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}