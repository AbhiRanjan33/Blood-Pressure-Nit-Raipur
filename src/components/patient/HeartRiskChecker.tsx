// src/components/patient/HeartRiskChecker.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Heart, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RiskResult {
  bp_category?: string;
  predicted_probability?: number;
  model?: string;
  raw_model_output?: string;
}

export default function HeartRiskChecker() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkRisk = async () => {
    if (!user?.id) {
      setError("Please log in.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Fetch profile
      const profileRes = await fetch(`/api/get-patient-profile?clerkId=${user.id}`);
      if (!profileRes.ok) throw new Error("Profile load failed");
      const profileData = await profileRes.json();
      if (!profileData.profile) throw new Error("Complete your profile first.");

      console.log("PROFILE LOADED:", profileData.profile);

      // 2. Fetch today's BP
      const today = new Date().toISOString().split('T')[0];
      const bpRes = await fetch(`/api/get-today-bp?clerkId=${user.id}&date=${today}`);
      if (!bpRes.ok) throw new Error("Add today's BP reading first.");
      const bpData = await bpRes.json();
      if (!bpData.reading) throw new Error("No BP reading for today.");

      console.log("TODAY'S BP READING:", bpData.reading);

      // 3. Build payload
      const payload = {
        gender: profileData.profile.gender === "male" ? "M" : "F",
        age: profileData.profile.age,
        body_mass_index: Number((profileData.profile.weight / ((profileData.profile.height / 100) ** 2)).toFixed(1)),
        smoker: profileData.profile.smoker === "yes" ? 1 : 0,
        systolic_blood_pressure: bpData.reading.systolic,
        diastolic_blood_pressure: bpData.reading.diastolic,
        hypertension_treated: profileData.profile.hypertension_treated === "yes" ? 1 : 0,
        family_history_of_cardiovascular_disease: profileData.profile.family_history_of_cardiovascular_disease === "yes" ? 1 : 0,
        atrial_fibrillation: profileData.profile.atrial_fibrillation === "yes" ? 1 : 0,
        chronic_kidney_disease: profileData.profile.chronic_kidney_disease === "yes" ? 1 : 0,
        rheumatoid_arthritis: profileData.profile.rheumatoid_arthritis === "yes" ? 1 : 0,
        diabetes: profileData.profile.diabetes === "yes" ? 1 : 0,
        chronic_obstructive_pulmonary_disorder: profileData.profile.chronic_obstructive_pulmonary_disorder === "yes" ? 1 : 0,
      };

      // LOG FULL PAYLOAD
      console.log("SENDING TO RENDER API (EXACT PAYLOAD):");
      console.table(payload);

      // 4. Call proxy
      const apiRes = await fetch('/api/check-heart-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!apiRes.ok) {
        const err = await apiRes.text();
        throw new Error("API error: " + err);
      }

      const apiData: RiskResult = await apiRes.json();

      // LOG RESPONSE
      console.log("RESPONSE FROM RENDER API:");
      console.log(apiData);

      setResult(apiData);
    } catch (err: any) {
      console.error("Heart Risk Error:", err);
      setError(err.message || "Failed to check risk.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (category?: string) => {
    if (!category) return "outline";
    const c = category.toLowerCase();
    switch (c) {
      case "crisis": return "destructive";
      case "high": return "destructive";
      case "elevated": return "secondary";
      case "normal": return "default";
      default: return "outline";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-600" />
          AI Heart Risk Diagnosis
        </CardTitle>
        <p className="text-sm text-gray-600">Powered by Gemini 2.5 Flash</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkRisk}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Analyzing..." : "Check Diagnosis for Today"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-medium">BP Status</span>
              <Badge variant={getRiskColor(result.bp_category)}>
                {result.bp_category?.toUpperCase() || "UNKNOWN"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Risk Probability</span>
              <span className="text-lg font-bold text-red-600">
                {result.predicted_probability != null 
                  ? (result.predicted_probability * 100).toFixed(1) + "%"
                  : "N/A"
                }
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="h-4 w-4" />
              Model: <code className="bg-gray-200 px-2 py-1 rounded">{result.model || "Unknown"}</code>
            </div>

            {result.raw_model_output && (
              <details className="text-xs bg-white p-2 rounded border mt-2">
                <summary className="cursor-pointer font-medium mb-1">Raw AI Output</summary>
                <pre className="whitespace-pre-wrap text-gray-700 text-xs">
                  {result.raw_model_output}
                </pre>
              </details>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                Check Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}