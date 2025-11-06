// src/app/consultation/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertCircle, Pill, User, X, Check, Stethoscope, Sparkles, Frown } from "lucide-react";
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
  const [swipeAction, setSwipeAction] = useState<"accept" | "reject" | null>(null);

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

 const handleSwipe = (action: "accept" | "reject") => {
  if (!currentDoctor || !currentDoctor.doctorProfile || swipeAction) return;

  setSwipeAction(action);

  setTimeout(() => {
    setSwipeAction(null);
    setCurrentIndex((prev) => (prev + 1) % doctors.length);
  }, 600);
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Finding doctors...</p>
        </div>
      </div>
    );
  }

  if (!request || doctors.length === 0) {
    return <div className="p-8 text-center">No data found.</div>;
  }

  const currentDoctor = doctors[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex flex-col relative">
      {/* PATIENT PROFILE - TOP RIGHT */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          size="lg"
          variant="outline"
          className="rounded-full shadow-xl flex items-center gap-2 bg-white"
          onClick={() => setShowProfile(true)}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Patient" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-2 text-blue-600" />
            )}
          </div>
          <span className="font-medium">Your Profile</span>
        </Button>
      </div>

      {/* CONSULTATION REQUEST */}
      <div className="max-w-4xl mx-auto w-full mb-8">
        <Card className="p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="text-green-600" />
              Your Consultation Request
            </h2>
            <Badge variant="secondary">
              {new Date(request.createdAt).toLocaleDateString()}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium flex items-center gap-1 text-gray-700">
                <Heart className="h-4 w-4 text-red-600" /> Vitals
              </p>
              <p className="text-gray-600">{request.vitals}</p>
            </div>
            <div>
              <p className="font-medium flex items-center gap-1 text-gray-700">
                <AlertCircle className="h-4 w-4 text-orange-600" /> Allergies
              </p>
              <p className="text-gray-600">{request.allergies || "None"}</p>
            </div>
            <div>
              <p className="font-medium flex items-center gap-1 text-gray-700">
                <Pill className="h-4 w-4 text-blue-600" /> Medications
              </p>
              <p className="text-gray-600">{request.medications || "None"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Notes</p>
              <p className="text-gray-600 italic">{request.notes}</p>
            </div>
          </div>
        </Card>
      </div>

 {/* TINDER CARD */}
<div className="flex-1 max-w-md mx-auto w-full relative h-full">
  {currentDoctor && currentDoctor.doctorProfile ? (
    <Card
      className={`absolute inset-0 p-8 shadow-2xl bg-white border-2 border-gray-200 transition-all duration-500
        ${swipeAction === "accept" ? "translate-x-96 scale-110 opacity-0" : ""}
        ${swipeAction === "reject" ? "-translate-x-96 scale-110 opacity-0" : ""}
      `}
    >
      <div className="flex flex-col h-full">
        {/* DOCTOR PHOTO */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-100 shadow-lg">
            {currentDoctor.doctorProfile.photoUrl ? (
              <img
                src={currentDoctor.doctorProfile.photoUrl}
                alt={currentDoctor.doctorProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <User className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* DOCTOR INFO */}
        <div className="text-center flex-1">
          <h3 className="text-2xl font-bold">{currentDoctor.doctorProfile.name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {currentDoctor.doctorProfile.hospitalName}
          </p>
          <div className="flex justify-center gap-4 mt-3 text-sm">
            <Badge variant="secondary">
              {currentDoctor.doctorProfile.experience} yrs exp
            </Badge>
            <Badge variant="outline">
              {currentDoctor.doctorProfile.registrationId}
            </Badge>
          </div>
        </div>

        {/* SWIPE BUTTONS */}
        <div className="flex justify-center gap-8 mt-8">
          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-red-500 text-red-600 hover:bg-red-50 relative overflow-hidden"
            onClick={() => handleSwipe("reject")}
            disabled={!!swipeAction}
          >
            <X className="h-8 w-8" />
            {swipeAction === "reject" && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100">
                <Frown className="h-12 w-12 text-red-600 animate-bounce" />
              </div>
            )}
          </Button>

          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 relative overflow-hidden"
            onClick={() => handleSwipe("accept")}
            disabled={!!swipeAction}
          >
            <Check className="h-8 w-8" />
            {swipeAction === "accept" && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-100">
                <Sparkles className="h-12 w-12 text-green-600 animate-ping" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </Card>
  ) : (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-green-600 rounded-full border-t-transparent" />
    </div>
  )}
</div>

      {/* PROFILE MODAL */}
      <PatientProfileCard open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}