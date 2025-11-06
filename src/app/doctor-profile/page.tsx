// src/app/doctor-profile/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, User, IdCard, ChevronRight, Loader2, Briefcase, Building2 } from "lucide-react";

export default function DoctorProfileForm() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    registrationId: "",
    experience: "",
    hospitalName: "",
    photo: null as File | null,
  });

  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !user?.id) return alert("Loading... Please wait.");

    const { name, registrationId, experience, hospitalName } = formData;
    if (!name.trim() || !registrationId.trim() || !experience || !hospitalName.trim()) {
      return alert("All fields are required.");
    }

    setLoading(true);
    try {
      let photoUrl = null;

      if (formData.photo) {
        setUploading(true);
        const uploadForm = new FormData();
        uploadForm.append("file", formData.photo);
        uploadForm.append("upload_preset", "doctor_profile");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: uploadForm }
        );

        if (!uploadRes.ok) throw new Error("Image upload failed");
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.secure_url;
        setUploading(false);
      }

      const res = await fetch('/api/save-doctor-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          name: name.trim(),
          registrationId: registrationId.trim(),
          experience: Number(experience),
          hospitalName: hospitalName.trim(),
          photoUrl,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Save failed');
      }

      alert("Doctor profile saved successfully!");
      router.push("/dashboard/doctor");
    } catch (err: any) {
      console.error("Save Error:", err);
      alert(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (!isLoaded) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Doctor Profile</CardTitle>
          <p className="text-gray-600 mt-2">Help patients trust your expertise</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PHOTO UPLOAD */}
            <div className="flex flex-col items-center">
              <Label className="mb-3">Profile Photo</Label>
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
              <p className="text-xs text-gray-500 mt-2">Click to upload (JPG, PNG)</p>
            </div>

            {/* NAME */}
            <div>
              <Label className="flex items-center gap-1">
                <User className="h-4 w-4" /> Full Name
              </Label>
              <Input
                placeholder="e.g., Dr. Sarah Johnson"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {/* REGISTRATION ID */}
            <div>
              <Label className="flex items-center gap-1">
                <IdCard className="h-4 w-4" /> Registration ID
              </Label>
              <Input
                placeholder="e.g., MCI-123456"
                value={formData.registrationId}
                onChange={(e) => setFormData((prev) => ({ ...prev, registrationId: e.target.value }))}
                required
              />
            </div>

            {/* EXPERIENCE */}
            <div>
              <Label className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" /> Years of Experience
              </Label>
              <Input
                type="number"
                min="0"
                max="60"
                placeholder="e.g., 8"
                value={formData.experience}
                onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
                required
              />
            </div>

            {/* HOSPITAL NAME */}
            <div>
              <Label className="flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Hospital / Clinic Name
              </Label>
              <Input
                placeholder="e.g., Apollo Hospital"
                value={formData.hospitalName}
                onChange={(e) => setFormData((prev) => ({ ...prev, hospitalName: e.target.value }))}
                required
              />
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={loading || uploading}
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Profile & Continue
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}