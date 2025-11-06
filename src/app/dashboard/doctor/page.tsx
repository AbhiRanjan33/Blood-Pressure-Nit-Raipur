// src/app/dashboard/doctor/page.tsx
"use client";

import { useState, useEffect } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, FileCheck, Activity, User, Clock, Heart, AlertCircle, Pill, FileText } from "lucide-react";
import DoctorProfileCard from "@/components/doctor/DoctorProfileCard";
import PrescriptionHistory from "@/components/doctor/PrescriptionHistory";
import { useRouter } from "next/navigation";

interface ConsultationRequest {
  _id: string;
  vitals: string;
  allergies: string;
  notes: string;
  medications: string;
  createdAt: string;
  assignedAt?: string;
  status?: string;
  patientName?: string;
  patientAge?: number;
  patientId?: string;
  prescription?: string;
  completedAt?: string;
}

export default function DoctorDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [consultRequests, setConsultRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const fetchRequests = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/get-doctor-consults?clerkId=${user.id}`);
          if (!res.ok) throw new Error("Failed to fetch");
          const data = await res.json();
          
          // FILTER OUT COMPLETED ONES
          const activeRequests = (data.requests || []).filter(
            (req: ConsultationRequest) => req.status !== "completed"
          );
          
          setConsultRequests(activeRequests);
        } catch (err) {
          console.error("Failed to load consults:", err);
          setConsultRequests([]);
        } finally {
          setLoading(false);
        }
      };
      fetchRequests();
    }
  }, [user?.id]);

  const handleReview = async (consultId: string) => {
    try {
      const res = await fetch(
        `/api/doctor-update-status?clerkId=${user?.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consultId, status: 'under review' }),
        }
      );

      if (!res.ok) throw new Error("Failed");

      router.push(`/dashboard/doctor/consultation/${consultId}`);
    } catch (err) {
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDeny = async (consultId: string) => {
    if (!confirm('Deny this request? It will be removed from your list.')) return;

    try {
      const res = await fetch(
        `/api/doctor-update-status?clerkId=${user?.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consultId, status: 'denied' }),
        }
      );

      if (!res.ok) throw new Error("Failed");

      setConsultRequests(prev => prev.filter(r => r._id !== consultId));
    } catch (err) {
      alert('Failed to deny request.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="text-blue-600" /> Doctor Dashboard
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

        {/* TOP CARDS */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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

        {/* INCOMING REQUESTS */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="text-green-600" />
            Incoming Consultation Requests
            <Badge variant="secondary" className="ml-2">
              {consultRequests.length}
            </Badge>
          </h2>

          {loading ? (
            <Card className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-600 rounded-full border-t-transparent mx-auto" />
              <p className="text-gray-600 mt-3">Loading requests...</p>
            </Card>
          ) : consultRequests.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No pending consultation requests.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {consultRequests.map((req) => (
                <Card key={req._id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {req.patientName || "Unknown Patient"}
                        {req.patientAge && ` (${req.patientAge} yrs)`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        req.status === "under review"
                          ? "default"
                          : req.status === "denied"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {req.status || "pending"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-600" /> Vitals
                      </p>
                      <p className="text-gray-700">{req.vitals}</p>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-orange-600" /> Allergies
                      </p>
                      <p className="text-gray-700">{req.allergies || "None"}</p>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <Pill className="h-4 w-4 text-blue-600" /> Medications
                      </p>
                      <p className="text-gray-700">{req.callback || "None"}</p>
                    </div>
                    <div>
                      <p className="font-medium">Notes</p>
                      <p className="text-gray-700 italic">{req.notes}</p>
                    </div>
                  </div>

                  {req.status !== "denied" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReview(req._id)}
                      >
                        Review Request
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDeny(req._id)}
                      >
                        Deny Request
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* PRESCRIPTION HISTORY */}
        <div className="mt-16">
          <PrescriptionHistory />
        </div>
      </div>

      <DoctorProfileCard open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}