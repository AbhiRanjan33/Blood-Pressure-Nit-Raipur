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
    name: "",  // ← NEW
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
      const res = await fetch('/api/save-patient-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          ...formData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Save failed');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Health Profile</CardTitle>
          <p className="text-gray-600 mt-2">Help us personalize your BP Health AI experience</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NAME FIELD */}
            <div>
              <Label htmlFor="name" className="flex items-center gap-1">
                <User className="h-4 w-4" /> Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            {/* ROW 1: Gender & Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(v) => handleChange("gender", v)} required>
                  <SelectTrigger id="gender">
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
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="e.g., 45"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ROW 2: Height & Weight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="100"
                  max="250"
                  placeholder="e.g., 170"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
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
                />
              </div>
            </div>

            {/* Smoker */}
            <div>
              <Label>Smoker?</Label>
              <RadioGroup onValueChange={(v) => handleChange("smoker", v)} required>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="smoker-yes" />
                  <Label htmlFor="smoker-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="smoker-no" />
                  <Label htmlFor="smoker-no">No</Label>
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
                <Label>
                  {field
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                    .replace("Of", "of")}
                  ?
                </Label>
                <RadioGroup onValueChange={(v) => handleChange(field, v)} required>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id={`${field}-yes`} />
                    <Label htmlFor={`${field}-yes`}>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id={`${field}-no`} />
                    <Label htmlFor={`${field}-no`}>No</Label>
                  </div>
                </RadioGroup>
              </div>
            ))}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Profile & Continue"}
              {!loading && <ChevronRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}