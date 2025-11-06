// components/doctor/PrescriptionForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export default function PrescriptionForm() {
  const [prescription, setPrescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id } = useParams(); // consultation ID

  const handleSaveAndComplete = async () => {
    if (!prescription.trim()) {
      alert("Please write a prescription before completing.");
      return;
    }

    if (!id) {
      alert("Error: Consultation ID not found.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/complete-consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: id,
          prescription: prescription.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save prescription");
      }

      // Success!
      alert("Prescription saved! Consultation completed.");
      router.push("/dashboard/doctor");
      router.refresh(); // Ensures dashboard updates instantly
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Failed to save: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-20 mb-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border-4 border-green-600 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8">
            <div className="flex items-center gap-4">
              <FileCheck className="h-12 w-12" />
              <div>
                <h2 className="text-3xl font-bold">Final Prescription</h2>
                <p className="text-green-50">Write the complete treatment plan for this patient</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Textarea
              placeholder={`Tab. Amlodipine 5mg - 1 tablet daily after dinner × 30 days\nTab. Atorvastatin 20mg - 1 tablet at bedtime × 30 days\nCap. Pantoprazole 40mg - 1 cap before breakfast × 15 days\n\nAdvice:\n• Low salt diet\n• Walk 30 mins daily\n• Follow up after 2 weeks`}
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
              className="min-h-80 text-lg font-medium resize-none border-2 border-green-200 focus:border-green-500 placeholder:text-gray-400"
              disabled={loading}
            />

            <div className="mt-8 flex justify-end">
              <Button
                size="lg"
                onClick={handleSaveAndComplete}
                disabled={loading || !prescription.trim()}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-16 py-8 shadow-xl hover:shadow-green-500/30 transition-all duration-300 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-8 w-8 mr-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FileCheck className="h-8 w-8 mr-4" />
                    Save & Complete Consultation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}