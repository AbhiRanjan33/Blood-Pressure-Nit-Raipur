// src/components/patient/PatientProfileCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Heart, Ruler, Weight, Cigarette, AlertCircle, CheckCircle, Edit3, Save, X } from "lucide-react";

interface ProfileData {
  name?: string;  // ← NEW
  gender: string;
  age: number;
  height: number;
  weight: number;
  smoker: string;
  hypertension_treated: string;
  family_history_of_cardiovascular_disease: string;
  atrial_fibrillation: string;
  chronic_kidney_disease: string;
  rheumatoid_arthritis: string;
  diabetes: string;
  chronic_obstructive_pulmonary_disorder: string;
}

export default function PatientProfileCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    if (open && user?.id) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/get-patient-profile?clerkId=${user.id}`);
          if (!res.ok) throw new Error("Failed to load");
          const data = await res.json();
          setProfile(data.profile);
          setFormData(data.profile);
        } catch (err) {
          console.error("Profile load error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [open, user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/update-patient-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, ...formData }),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setProfile(data.profile);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const YesNoBadge = ({ value }: { value: string }) => (
    <Badge variant={value === "yes" ? "destructive" : "default"} className="text-xs">
      {value === "yes" ? (
        <>
          <AlertCircle className="h-3 w-3 mr-1" />
          Yes
        </>
      ) : (
        <>
          <CheckCircle className="h-3 w-3 mr-1" />
          No
        </>
      )}
    </Badge>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Your Health Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setFormData(profile || {});
                  setEditMode(false);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : !profile ? (
            <p className="text-center text-red-500">Profile not found.</p>
          ) : editMode ? (
            // === EDIT FORM ===
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
    <Label>Full Name</Label>
    <Input
      type="text"
      value={formData.name || ""}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      placeholder="John Doe"
    />
  </div>
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => setFormData({ ...formData, gender: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label>Smoker?</Label>
                <RadioGroup
                  value={formData.smoker}
                  onValueChange={(v) => setFormData({ ...formData, smoker: v })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" />
                    <Label>Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" />
                    <Label>No</Label>
                  </div>
                </RadioGroup>
              </div>

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
                    {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).replace("Of", "of")}?
                  </Label>
                  <RadioGroup
                    value={formData[field as keyof ProfileData] as string}
                    onValueChange={(v) => setFormData({ ...formData, [field]: v })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" />
                      <Label>Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" />
                      <Label>No</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          ) : (
            // === VIEW MODE ===
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
    <p className="text-sm text-gray-500">Name</p>
    <p className="font-medium capitalize">{profile.name || "Not set"}</p>
  </div>
                <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium capitalize">{profile.gender}</p></div>
                <div><p className="text-sm text-gray-500">Age</p><p className="font-medium">{profile.age} years</p></div>
                <div><p className="text-sm text-gray-500 flex items-center gap-1"><Ruler className="h-4 w-4" /> Height</p><p className="font-medium">{profile.height} cm</p></div>
                <div><p className="text-sm text-gray-500 flex items-center gap-1"><Weight className="h-4 w-4" /> Weight</p><p className="font-medium">{profile.weight} kg</p></div>
              </div>

              <div className="text-center py-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">
                  BMI: {(profile.weight / ((profile.height / 100) ** 2)).toFixed(1)}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2"><Cigarette className="h-5 w-5 text-orange-600" /> Smoker</p>
                  <YesNoBadge value={profile.smoker} />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" /> Health Conditions
                </h3>
                {[
                  { label: "Hypertension Treated", key: "hypertension_treated" },
                  { label: "Family History of CVD", key: "family_history_of_cardiovascular_disease" },
                  { label: "Atrial Fibrillation", key: "atrial_fibrillation" },
                  { label: "Chronic Kidney Disease", key: "chronic_kidney_disease" },
                  { label: "Rheumatoid Arthritis", key: "rheumatoid_arthritis" },
                  { label: "Diabetes", key: "diabetes" },
                  { label: "COPD", key: "chronic_obstructive_pulmonary_disorder" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <p className="text-sm">{item.label}</p>
                    <YesNoBadge value={profile[item.key as keyof ProfileData] as string} />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}