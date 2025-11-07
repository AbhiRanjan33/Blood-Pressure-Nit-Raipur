// src/components/patient/BPReminderToggle.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Phone } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface BPReminderToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export default function BPReminderToggle({ onToggle }: BPReminderToggleProps) {
  const { user } = useUser();
  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Load saved reminder
  useEffect(() => {
    if (!user?.id) return;

    const fetchReminder = async () => {
      try {
        const res = await fetch(`/api/get-reminder?clerkId=${user.id}`);
        const data = await res.json();
        if (data.reminder) {
          setEnabled(data.reminder.enabled);
          setPhone(data.reminder.phone);
          setShowInput(false); // ← Hide input if already saved
        }
      } catch (err) {
        console.error("Failed to load reminder");
      }
    };

    fetchReminder();
  }, [user]);

  const saveReminder = async () => {
    if (!user?.id || !phone.match(/^\+?[1-9]\d{1,14}$/)) {
      alert("Please enter a valid phone number (e.g., +919876543210)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/set-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id, enabled, phone }),
      });

      const data = await res.json();
      if (data.success) {
        setShowInput(false); // ← Hide input after save
        onToggle?.(enabled);
      } else {
        alert("Failed: " + data.error);
      }
    } catch (err) {
      alert("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    if (!enabled && !phone) {
      setShowInput(true); // First time → ask for number
    } else {
      setEnabled(!enabled);
      if (phone) saveReminder(); // Already have number → just toggle
    }
  };

  return (
    <div className="flex items-center gap-3">
      {showInput ? (
        /* ---- INPUT MODE ---- */
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="phone" className="text-xs">
              Phone for 8AM/8PM Call
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-48 text-sm"
            />
          </div>
          <Button
            size="sm"
            onClick={saveReminder}
            disabled={loading || !phone}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowInput(false);
              setEnabled(false);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        /* ---- TOGGLE MODE ---- */
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            disabled={loading}
            className={`flex items-center gap-2 ${
              enabled ? "border-green-500 text-green-700" : "border-gray-300"
            }`}
          >
            {enabled ? (
              <>
                <Bell className="h-4 w-4" />
                Reminder ON
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Set Reminder
              </>
            )}
          </Button>

          {/* HIDE PHONE WHEN ON & SAVED */}
          {/* Remove this block entirely */}
        </>
      )}
    </div>
  );
}