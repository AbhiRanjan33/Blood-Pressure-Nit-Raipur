// src/components/patient/HeartRiskChecker.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Heart, Activity, Siren } from "lucide-react";
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
  const [sosTriggered, setSosTriggered] = useState(false);

  const triggerAutoSOS = async () => {
    if (!user?.id || sosTriggered) return;

    try {
      const res = await fetch("/api/trigger-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: user.id }),
      });

      const data = await res.json();
      if (data.success) {
        setSosTriggered(true);
        console.log("AUTO SOS CALL SENT TO EMERGENCY CONTACTS");
      }
    } catch (err) {
      console.error("Auto SOS failed:", err);
    }
  };

  const checkRisk = async () => {
    if (!user?.id) {
      setError("Please log in.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSosTriggered(false);

    try {
      const profileRes = await fetch(`/api/get-patient-profile?clerkId=${user.id}`);
      if (!profileRes.ok) throw new Error("Profile load failed");
      const profileData = await profileRes.json();
      if (!profileData.profile) throw new Error("Complete your profile first.");

      const today = new Date().toISOString().split('T')[0];
      const bpRes = await fetch(`/api/get-today-bp?clerkId=${user.id}&date=${today}`);
      if (!bpRes.ok) throw new Error("Add today's BP reading first.");
      const bpData = await bpRes.json();
      if (!bpData.reading) throw new Error("No BP reading for today.");

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
      setResult(apiData);

      // AUTO SOS IF RISK > 80%
      if (apiData.predicted_probability && apiData.predicted_probability >= 0.75) {
        await triggerAutoSOS();
      }

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
    <Card className="w-full border-2 border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-600 animate-pulse" />
          AI Heart Risk Diagnosis
        </CardTitle>
        <p className="text-sm text-gray-600">Powered by Gemini 2.5 Flash</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={checkRisk}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 font-bold"
        >
          {loading ? "Analyzing..." : "Check Diagnosis for Today"}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {sosTriggered && (
          <Alert className="bg-red-100 border-red-500">
            <Siren className="h-5 w-5 text-red-600 animate-spin" />
            <AlertDescription className="font-bold text-red-800">
              EMERGENCY SOS SENT! Your contacts are being called NOW!
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className={`space-y-4 p-6 rounded-lg border-4 ${
            result.predicted_probability! > 0.8 
              ? "bg-red-100 border-red-600 animate-pulse" 
              : "bg-gradient-to-r from-red-50 to-orange-50 border-orange-400"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">BP Status</span>
              <Badge variant={getRiskColor(result.bp_category)}>
                {result.bp_category?.toUpperCase() || "UNKNOWN"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-lg">Heart Attack Risk</span>
              <span className={`text-3xl font-bold ${
                result.predicted_probability! > 0.8 ? "text-red-700" : "text-red-600"
              }`}>
                {(result.predicted_probability! * 100).toFixed(1)}%
              </span>
            </div>

            {result.predicted_probability! > 0.8 && (
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-red-800 animate-pulse">
                  CRITICAL RISK — CALL SENT
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="h-4 w-4" />
              Model: <code className="bg-gray-200 px-2 py-1 rounded">{result.model || "Gemini"}</code>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
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