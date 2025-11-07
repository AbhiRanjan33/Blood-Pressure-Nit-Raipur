// src/app/consultation/[id]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertCircle, Pill, User, X, Check, Stethoscope, ArrowLeft } from "lucide-react";
import PatientProfileCard from "@/components/patient/PatientProfileCard";

interface ConsultationRequest {
  _id: string;
  vitals: string;
  allergies: string;
  notes: string;
  medications: string;
  createdAt: string;
}

interface Doctor {
  _id: string;
  doctorProfile: {
    name: string;
    registrationId: string;
    photoUrl?: string;
    experience: number;
    hospitalName: string;
  };
}

export default function ConsultationMatch() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [request, setRequest] = useState<ConsultationRequest | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const reqRes = await fetch(`/api/get-consultation?id=${id}&clerkId=${user.id}`);
          if (!reqRes.ok) throw new Error("Request not found");
          const reqData = await reqRes.json();
          setRequest(reqData.request);

          const docRes = await fetch('/api/get-doctors');
          if (!docRes.ok) throw new Error("Doctors not found");
          const docData = await docRes.json();
          setDoctors(docData.doctors);
        } catch (err) {
          alert("Failed to load data.");
          router.push("/dashboard/patient");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, user?.id, router]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setDragStart("clientX" in e ? e.clientX : e.touches[0].clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = "clientX" in e ? e.clientX : e.touches[0].clientX;
    setDragOffset(currentX - dragStart);
  };

  const handleDragEnd = async () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(dragOffset) > 80) {
      if (dragOffset > 0) {
        await handleSwipe("accept");
      } else {
        handleSwipe("reject");
      }
    }
    setDragOffset(0);
  };

  const handleSwipe = async (action: "accept" | "reject") => {
    const currentDoctor = doctors[currentIndex];
    if (!currentDoctor || !currentDoctor.doctorProfile) return;

    if (action === "accept") {
      try {
        const res = await fetch('/api/assign-consult-to-doctor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientClerkId: user?.id,
            doctorId: currentDoctor._id,
            consultRequestId: request?._id,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          console.error("Assign failed:", error);
          alert("Failed to assign doctor. Please try again.");
        } else {
          console.log("Consult assigned to:", currentDoctor.doctorProfile.name);
        }
      } catch (err) {
        console.error("Network error:", err);
        alert("Network error. Please check connection.");
      }
    }

    // next doctor
    setCurrentIndex(prev => (prev + 1) % (doctors.length || 1));
  };

  const handleComplete = () => {
    router.push("/dashboard/patient");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-sky-500 rounded-full border-t-transparent mx-auto mb-4" />
          <p className="text-gray-700 font-medium">Finding doctors...</p>
        </div>
      </div>
    );
  }

  if (!request || doctors.length === 0) {
    return <div className="p-8 text-center bg-gray-50 min-h-screen">No data found.</div>;
  }

  const currentDoctor = doctors[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER WITH PATIENT PROFILE */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            className="rounded-full shadow-sm bg-white hover:bg-gray-50 text-sm px-3 py-2"
            onClick={() => router.push("/dashboard/patient")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full shadow-sm flex items-center gap-2 bg-white hover:bg-gray-50 text-sm"
              onClick={() => setShowProfile(true)}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-sky-200">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Patient" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-1 text-sky-600" />
                )}
              </div>
              <span className="font-medium">Your Profile</span>
            </Button>
          </div>
        </div>

        {/* CONSULTATION REQUEST CARD */}
        <Card className="p-4 mb-6 shadow-sm bg-white border border-gray-100 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-sky-50 border border-sky-100">
                <Stethoscope className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Consultation Request</h2>
                <div className="text-xs text-gray-500 mt-1">{new Date(request.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs px-2 py-1">Request</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-md border border-red-100">
              <p className="font-semibold flex items-center gap-2 text-red-700 mb-1">
                <Heart className="h-4 w-4" /> Vitals
              </p>
              <p className="text-gray-800">{request.vitals}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-md border border-orange-100">
              <p className="font-semibold flex items-center gap-2 text-orange-700 mb-1">
                <AlertCircle className="h-4 w-4" /> Allergies
              </p>
              <p className="text-gray-800">{request.allergies || "None"}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-md border border-blue-100">
              <p className="font-semibold flex items-center gap-2 text-blue-700 mb-1">
                <Pill className="h-4 w-4" /> Medications
              </p>
              <p className="text-gray-800">{request.medications || "None"}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-md border border-purple-100">
              <p className="font-semibold text-purple-700 mb-1">Notes</p>
              <p className="text-gray-800 italic">{request.notes}</p>
            </div>
          </div>
        </Card>

        {/* DOCTOR SELECTION HEADER */}
        <Card className="p-3 mb-6 shadow-sm bg-white border border-gray-100 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-base font-semibold text-gray-900">Select a Doctor for Validation</div>
              <div className="text-xs text-gray-500 mt-1">Doctor {currentIndex + 1} of {doctors.length}</div>
            </div>
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-medium rounded-full text-sm px-4 py-2 shadow"
            >
              Complete Session
            </Button>
          </div>
        </Card>

        {/* SWIPEABLE DOCTOR CARD */}
        <div className="relative" style={{ height: "480px" }}>
          {currentDoctor && currentDoctor.doctorProfile ? (
            <div
              ref={cardRef}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.04}deg) scale(${isDragging ? 1.02 : 1})`,
                transition: isDragging ? "none" : "transform 250ms ease-out",
              }}
            >
              {/* Selection/Skip Badges */}
              {dragOffset > 80 && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-emerald-600 text-white text-sm px-3 py-1 font-semibold shadow">✓ Selected</Badge>
                </div>
              )}
              {dragOffset < -80 && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-red-500 text-white text-sm px-3 py-1 font-semibold shadow">× Skipped</Badge>
                </div>
              )}

              <Card className="h-full p-6 shadow-lg bg-white border border-gray-100 rounded-lg">
                <div className="flex flex-col h-full">
                  {/* DOCTOR PHOTO */}
                  <div className="flex justify-center mb-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-sky-50 shadow-sm">
                      {currentDoctor.doctorProfile.photoUrl ? (
                        <img
                          src={currentDoctor.doctorProfile.photoUrl}
                          alt={currentDoctor.doctorProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-sky-50 flex items-center justify-center">
                          <User className="h-12 w-12 text-sky-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DOCTOR INFO */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{currentDoctor.doctorProfile.name}</h3>
                    <p className="text-sm text-sky-600 font-medium mt-1">{currentDoctor.doctorProfile.hospitalName}</p>
                  </div>

                  {/* STATS GRID */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Card className="p-3 bg-sky-50 border border-sky-100 text-center rounded-md shadow-none">
                      <div className="text-gray-600 text-xs font-medium mb-1">Experience</div>
                      <div className="text-lg font-bold text-gray-900">{currentDoctor.doctorProfile.experience} yrs</div>
                    </Card>
                    <Card className="p-3 bg-indigo-50 border border-indigo-100 text-center rounded-md shadow-none">
                      <div className="text-gray-600 text-xs font-medium mb-1">Registration</div>
                      <div className="text-sm font-bold text-gray-900">{currentDoctor.doctorProfile.registrationId}</div>
                    </Card>
                  </div>

                  {/* CREDENTIALS */}
                  <Card className="p-3 bg-white border border-gray-100 text-center rounded-md mb-3 shadow-none">
                    <div className="text-gray-600 text-xs font-medium mb-1">Hospital</div>
                    <div className="text-sm font-semibold text-gray-900">{currentDoctor.doctorProfile.hospitalName}</div>
                  </Card>

                  {/* SWIPE INSTRUCTION (small) */}
                  <div className="text-center mt-auto">
                    <div className="text-xs text-gray-500">Drag right to select • Drag left to skip</div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin h-10 w-10 border-4 border-sky-500 rounded-full border-t-transparent" />
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-center gap-4 mt-5">
          <Button
            onClick={() => handleSwipe("reject")}
            size="lg"
            variant="outline"
            className="rounded-full px-6 py-3 border border-red-400 text-red-600 hover:bg-red-50 text-sm shadow-sm"
          >
            Skip Doctor
          </Button>
          <Button
            onClick={() => handleSwipe("accept")}
            size="lg"
            className="rounded-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow"
          >
            Select Doctor
          </Button>
        </div>
      </div>

      {/* PROFILE MODAL */}
      <PatientProfileCard open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
