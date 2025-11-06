// src/components/doctor/DoctorProfileCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, User, IdCard, Edit3, Save, X, Loader2, Briefcase, Building2 } from "lucide-react";

interface DoctorProfile {
  name: string;
  registrationId: string;
  photoUrl?: string;
  experience: number;
  hospitalName: string;
}

export default function DoctorProfileCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useUser();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<DoctorProfile>>({});
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open && user?.id) {
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/get-doctor-profile?clerkId=${user.id}`);
          if (!res.ok) throw new Error("Failed to load");
          const data = await res.json();
          setProfile(data.doctorProfile);
          setFormData(data.doctorProfile);
          setPreview(data.doctorProfile.photoUrl || null);
        } catch (err) {
          console.error("Doctor profile load error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [open, user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      let photoUrl = profile?.photoUrl;

      if ((formData as any).photo) {
        setUploading(true);
        const uploadForm = new FormData();
        uploadForm.append("file", (formData as any).photo);
        uploadForm.append("upload_preset", "doctor_profile");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: uploadForm }
        );

        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.secure_url;
        setUploading(false);
      }

      const res = await fetch('/api/update-doctor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          name: formData.name?.trim(),
          registrationId: formData.registrationId?.trim(),
          experience: Number(formData.experience),
          hospitalName: formData.hospitalName?.trim(),
          photoUrl,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setProfile(data.doctorProfile);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6 text-blue-600" />
            Doctor Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={saving || uploading}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving || uploading ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setFormData(profile || {});
                  setPreview(profile?.photoUrl || null);
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
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : !profile ? (
            <p className="text-center text-red-500">Profile not found.</p>
          ) : editMode ? (
            // === EDIT MODE ===
            <div className="space-y-5">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </div>
              </div>

              <div>
                <Label>Full Name</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Sarah Johnson"
                />
              </div>

              <div>
                <Label>Registration ID</Label>
                <Input
                  value={formData.registrationId || ""}
                  onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                  placeholder="MCI-123456"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> Years of Experience
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.experience || ""}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  placeholder="8"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> Hospital / Clinic
                </Label>
                <Input
                  value={formData.hospitalName || ""}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  placeholder="Apollo Hospital"
                />
              </div>
            </div>
          ) : (
            // === VIEW MODE ===
            <>
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-xl font-semibold">{profile.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <IdCard className="h-4 w-4" /> Registration ID
                  </p>
                  <Badge variant="secondary" className="text-sm mt-1">
                    {profile.registrationId}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Briefcase className="h-4 w-4" /> Experience
                  </p>
                  <p className="font-medium">{profile.experience} years</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    <Building2 className="h-4 w-4" /> Hospital / Clinic
                  </p>
                  <p className="font-medium">{profile.hospitalName}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}