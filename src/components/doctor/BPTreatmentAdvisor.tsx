// components/doctor/BPTreatmentAdvisor.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2, Stethoscope, HeartPulse, Lock } from "lucide-react";

interface Props {
  age: number;
  vitals: string;
  medications: string;
  consultId: string; // ← NEW PROP
}

interface ApiResponse {
  htn_grade: string;
  classified_medications: string[];
  recommendation: string;
}

export default function BPTreatmentAdvisor({ age, vitals, medications, consultId }: Props) {
  const [ckd, setCkd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [fetchingCKD, setFetchingCKD] = useState(true);

  // Fetch CKD from DB on mount
  useEffect(() => {
    const fetchCKD = async () => {
      try {
        const res = await fetch(`/api/consult/${consultId}/ckd`);
        if (!res.ok) throw new Error("Failed to fetch CKD status");
        const { hasCKD } = await res.json();
        setCkd(hasCKD);
      } catch (err) {
        console.error("CKD fetch failed:", err);
      } finally {
        setFetchingCKD(false);
      }
    };

    if (consultId) {
      fetchCKD();
    } else {
      setFetchingCKD(false);
    }
  }, [consultId]);

  const handleGetRecommendation = async () => {
    setLoading(true);
    setError("");
    setData(null);

    const [systolic, diastolic] = vitals.split("/").map(Number);

    try {
      const res = await fetch("http://127.0.0.1:5050/get-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          systolic,
          diastolic,
          hasCKD: ckd, // ← FROM DB, DOCTOR CANNOT CHANGE
          medicationsText: medications || "None",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result: ApiResponse = await res.json();
      setData(result);
    } catch (err: any) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Backend not running! Run: python app.py (port 5050)"
          : `Error: ${err.message}`
      );
      console.error("BP Advisor Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes("III")) return "bg-red-600";
    if (grade.includes("II")) return "bg-orange-600";
    if (grade.includes("I")) return "bg-yellow-600";
    return "bg-green-600";
  };

  return (
    <Card className="mt-12 shadow-2xl border-4 border-purple-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8">
        <div className="flex items-center gap-4">
          <Stethoscope className="h-12 w-12" />
          <div>
            <h2 className="text-3xl font-bold">Hypertension Treatment Advisor</h2>
            <p className="text-purple-100">AI-powered guideline-based recommendation</p>
          </div>
        </div>
      </div>

      <div className="p-8 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <Label className="text-lg font-semibold text-gray-700">Patient Age</Label>
            <p className="text-2xl font-bold text-purple-700 mt-2">{age} yrs</p>
          </div>
          <div>
            <Label className="text-lg font-semibold text-gray-700">Blood Pressure</Label>
            <p className="text-2xl font-bold text-red-600 mt-2 flex items-center gap-2">
              <HeartPulse className="h-8 w-8" />
              {vitals} mmHg
            </p>
          </div>
          <div>
            <Label className="text-lg font-semibold text-gray-700">Current Medications</Label>
            <p className="text-lg font-medium text-gray-800 mt-2">
              {medications || "None"}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ckd}
              disabled // ← DOCTOR CANNOT CHANGE
              className="h-6 w-6 text-purple-600 rounded border-2 border-purple-300 cursor-not-allowed opacity-70"
            />
            <span className="text-lg font-medium text-gray-800 flex items-center gap-2">
              Patient has <strong>Chronic Kidney Disease (CKD)</strong>
              <Lock className="h-4 w-4 text-gray-500" />
              {fetchingCKD && <span className="text-sm text-gray-500">(loading...)</span>}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleGetRecommendation}
            disabled={loading || fetchingCKD}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xl px-16 py-8 shadow-xl"
          >
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 mr-3 animate-spin" />
                Analyzing with Gemini...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 mr-3" />
                Get AI Recommendation
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-8 p-6 bg-red-50 border-2 border-red-300 rounded-xl text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-3" />
            <p className="text-xl font-bold text-red-700">{error}</p>
          </div>
        )}

        {data && !error && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border-2 border-orange-300">
              <div>
                <p className="text-lg font-semibold text-orange-800">Hypertension Grade</p>
                <p className="text-3xl font-bold text-orange-900">{data.htn_grade}</p>
              </div>
              <Badge className={`${getGradeColor(data.htn_grade)} text-white text-xl px-6 py-3`}>
                {data.htn_grade}
              </Badge>
            </div>

            {data.classified_medications.length > 0 && (
              <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-300">
                <p className="text-lg font-semibold text-blue-800 mb-3">Detected Drug Classes</p>
                <div className="flex flex-wrap gap-3">
                  {data.classified_medications.map((med) => (
                    <Badge key={med} className="bg-blue-600 text-white text-lg px-4 py-2">
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-300 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-green-800 mb-4 text-center">
                Recommended Treatment Plan
              </h3>
              <pre className="whitespace-pre-wrap font-medium text-xl text-gray-800 leading-relaxed font-mono bg-white p-8 rounded-xl border-2 border-green-200 shadow-inner">
                {data.recommendation}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}