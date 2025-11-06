// src/components/patient/ConsultDoctorForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, User, Heart, AlertCircle, Pill, Loader2 } from "lucide-react";

interface Profile {
  name: string;
  age: number;
}

export default function ConsultDoctorForm() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, isLoaded } = useUser();

  const [vitals, setVitals] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState("");

  useEffect(() => {
    if (open && isLoaded && user?.id) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/get-patient-profile?clerkId=${user.id}`);
          if (!res.ok) throw new Error("Failed to load profile");
          const data = await res.json();
          setProfile({ name: data.profile.name, age: data.profile.age });
        } catch (err) {
          console.error("Profile fetch error:", err);
          alert("Could not load profile.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [open, user?.id, isLoaded]);

  const handleSubmit = async () => {
  if (!vitals || !allergies || !notes || !medications) {
    alert("Please fill all fields.");
    return;
  }

  if (!user?.id) {
    alert("Please wait for login...");
    return;
  }

  setSubmitting(true);
  try {
    const res = await fetch('/api/submit-consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: user.id,
        vitals,
        allergies,
        notes,
        medications,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to save");
    }

    const { requestId } = await res.json(); // Get the new request ID

    alert("Consultation request submitted successfully!");
    setOpen(false);
    setVitals("");
    setAllergies("");
    setNotes("");
    setMedications("");

    // Redirect to matching page
    window.location.href = `/consultation/${requestId}`;
    // OR use router if imported: router.push(`/consultation/${requestId}`);
  } catch (err: any) {
    console.error("Submit error:", err);
    alert(err.message || "Failed to submit request.");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <>
      <div className="p-6">
        <Stethoscope className="h-10 w-10 text-green-600 mb-4" />
        <h2 className="text-xl font-semibold">Consult a Doctor</h2>
        <p className="text-gray-600">Request a consultation</p>
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="w-full mt-6 bg-green-600 hover:bg-green-700"
        >
          <Stethoscope className="mr-2 h-5 w-5" />
          Start Consultation
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-green-600" />
              Consultation Request
            </DialogTitle>
            <DialogDescription>
              Share your health details for a doctor review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" /> Patient Profile
              </Label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : profile ? (
                <Input disabled value={`${profile.name}, Age ${profile.age}`} className="bg-gray-50" />
              ) : (
                <Input disabled value="Profile not found" className="bg-gray-50" />
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Heart className="h-4 w-4" /> Vitals
              </Label>
              <Input
                placeholder="e.g., BP 152/96"
                value={vitals}
                onChange={(e) => setVitals(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Allergies
              </Label>
              <Input
                placeholder="e.g., Penicillin, Ibuprofen"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Patient Notes
              </Label>
              <Textarea
                placeholder="hypertension for 2 years, history of asthma and diabetes, dry cough"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Pill className="h-4 w-4" /> Other Medications
              </Label>
              <Input
                placeholder="e.g., Metformin"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}