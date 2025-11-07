// components/patient/EmergencyContactsCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { Phone, Save, CheckCircle, AlertCircle, Flag, Loader2 } from "lucide-react";

export default function EmergencyContactsCard() {
  const { user, isLoaded } = useUser(); // ← isLoaded is KEY
  const clerkId = user?.id;

  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // DO NOT MAKE API CALL UNTIL user is fully loaded
  useEffect(() => {
    if (!isLoaded || !clerkId) return;

    const loadContacts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/patient/emergency-contacts?clerkId=${clerkId}`);
        if (res.ok) {
          const data = await res.json();
          setPhone1(data.emergencyContacts[0]?.phone || "");
          setPhone2(data.emergencyContacts[1]?.phone || "");
        }
      } catch (err) {
        setError("Failed to load contacts");
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [clerkId, isLoaded]);

  const handleSave = async () => {
    if (!clerkId) {
      setError("User not loaded. Try again.");
      return;
    }
    if (!phone1 || !phone2) {
      setError("Both numbers required");
      return;
    }
    if (!/^\d{10}$/.test(phone1) || !/^\d{10}$/.test(phone2)) {
      setError("Enter valid 10-digit Indian numbers");
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/patient/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId, // ← GUARANTEED TO EXIST
          emergencyContacts: [
            { name: "Emergency Contact 1", phone: phone1 },
            { name: "Emergency Contact 2", phone: phone2 },
          ],
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error || "Save failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // SHOW LOADING UNTIL USER IS READY
  if (!isLoaded) {
    return (
      <Card className="p-6 border-2 border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-red-600" />
          <span>Loading...</span>
        </div>
      </Card>
    );
  }

  if (!clerkId) {
    return (
      <Card className="p-6 border-2 border-red-200 bg-red-50">
        <div className="text-red-600">User not authenticated</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2 border-red-200 bg-red-50">
      <div className="flex items-center gap-3 mb-4">
        <Flag className="h-8 w-8 text-red-600" />
        <h3 className="text-xl font-bold text-red-800">Emergency Contacts</h3>
      </div>
      <p className="text-sm text-red-700 mb-4">
        Add 2 trusted contacts for emergency alerts
      </p>

      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-red-600" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Contact 1 (10-digit)</Label>
            <Input
              type="tel"
              value={phone1}
              onChange={(e) => setPhone1(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98XXXXXXXX"
              maxLength={10}
            />
          </div>
          <div>
            <Label>Contact 2 (10-digit)</Label>
            <Input
              type="tel"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98XXXXXXXX"
              maxLength={10}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {saved && (
            <div className="text-green-600 font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Saved successfully!
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Contacts
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}