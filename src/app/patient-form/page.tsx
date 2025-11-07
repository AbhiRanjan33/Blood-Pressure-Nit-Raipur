// src/app/patient-profile/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, User } from "lucide-react";

export default function PatientProfileForm() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    height: "",
    weight: "",
    smoker: "",
    hypertension_treated: "",
    family_history_of_cardiovascular_disease: "",
    atrial_fibrillation: "",
    chronic_kidney_disease: "",
    rheumatoid_arthritis: "",
    diabetes: "",
    chronic_obstructive_pulmonary_disorder: "",
  });

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !user?.id) {
      alert("Loading... Please wait.");
      return;
    }

    if (!formData.name.trim()) {
      alert("Name is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/save-patient-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          ...formData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Save failed");
      }

      alert("Profile saved successfully!");
      router.push("/dashboard/patient");
    } catch (err: any) {
      console.error("Save Error:", err);
      alert(err.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="p-8">Loading...</div>;

  return (
    <div
  className="min-h-screen flex items-center justify-center p-4 relative"
  style={{
    background: `
      linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.7) 0%,
        rgba(255, 255, 255, 0.9) 70%,
        #f9fafb 100%
      ),
      url('/pod.jpg') center top / cover no-repeat fixed
    `,
  }}
>
      

      {/* Form Content */}
      <div className="relative z-10 w-full max-w-2xl">
        <Card className="shadow-2xl bg-white/95 backdrop-blur-md border border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Health Profile</CardTitle>
            <p className="text-gray-600 mt-2">Help us personalize your BP Health AI experience</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NAME FIELD */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-1 text-gray-800">
                  <User className="h-4 w-4" /> Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              {/* ROW 1: Gender & Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender" className="text-gray-800">Gender</Label>
                  <Select onValueChange={(v) => handleChange("gender", v)} required>
                    <SelectTrigger id="gender" className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="age" className="text-gray-800">Age (years)</Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g., 45"
                    value={formData.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* ROW 2: Height & Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height" className="text-gray-800">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    placeholder="e.g., 170"
                    value={formData.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="weight" className="text-gray-800">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="30"
                    max="300"
                    step="0.1"
                    placeholder="e.g., 75.5"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Smoker */}
              <div>
                <Label className="text-gray-800">Smoker?</Label>
                <RadioGroup onValueChange={(v) => handleChange("smoker", v)} required>
                  <div className="flex items-center space-x-2 mt-2">
                    <RadioGroupItem value="yes" id="smoker-yes" />
                    <Label htmlFor="smoker-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="smoker-no" />
                    <Label htmlFor="smoker-no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Yes/No Questions */}
              {[
                "hypertension_treated",
                "family_history_of_cardiovascular_disease",
                "atrial_fibrillation",
                "chronic_kidney_disease",
                "rheumatoid_arthritis",
                "diabetes",
                "chronic_obstructive_pulmonary_disorder",
              ].map((field) => (
                <div key={field}>
                  <Label className="text-gray-800">
                    {field
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                      .replace("Of", "of")}
                    ?
                  </Label>
                  <RadioGroup onValueChange={(v) => handleChange(field, v)} required>
                    <div className="flex items-center space-x-2 mt-2">
                      <RadioGroupItem value="yes" id={`${field}-yes`} />
                      <Label htmlFor={`${field}-yes`} className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id={`${field}-no`} />
                      <Label htmlFor={`${field}-no`} className="cursor-pointer">No</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="I dont know" id={`${field}-unknown`} />
                      <Label htmlFor={`${field}-unknown`} className="cursor-pointer">I don't know</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg bg-red-900 hover:bg-red-800 text-white disabled:opacity-50 transition"
              >
                {loading ? "Saving..." : "Save Profile & Continue"}
                {!loading && <ChevronRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}