// src/components/patient/BPChartCard.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity, TrendingUp, Brain, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Reading {
  date: string;
  systolic: number;
  diastolic: number;
  time: string;
}

interface Forecast {
  tomorrowSystolic: string;
  tomorrowDiastolic: string;
  confidence: string;
  trend: string;
}

export default function BPChartCard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<Reading[]>([]);
  const [average, setAverage] = useState<{ systolic: number; diastolic: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [forecastError, setForecastError] = useState("");

  const fetchReadings = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/bp-summary?clerkId=${user.id}`);
      const result = await res.json();
      setData(result.readings || []);
      setAverage(result.average);
      setLoading(false);
    } catch (err) {
      console.error("Fetch BP Summary Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchReadings();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) fetchReadings();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const predictTomorrowBP = async () => {
    if (data.length < 3) {
      setForecastError("Need at least 3 days of data for accurate prediction.");
      return;
    }

    setForecastLoading(true);
    setForecastError("");
    setForecast(null);

    const readingsText = data
      .slice(-7)
      .map((r) => `${r.date}: ${r.systolic}/${r.diastolic} mmHg at ${r.time}`)
      .join("\n");

    const prompt = `You are a medical AI expert in blood pressure trends.

PATIENT BP HISTORY (Last 7 Days - Most Recent First):
${readingsText}

Predict TOMORROW's (8 Nov 2025) BP range based on trend, time of day, and medical logic.

Output ONLY valid JSON (no \`\`\`json or extra text):

{
  "tomorrowSystolic": "140-155",
  "tomorrowDiastolic": "85-95",
  "confidence": "High",
  "trend": "Rising"
}

RULES:
- Rising: systolic up >10 in 3 days
- Stable: ±5 mmHg
- Confidence: High (5+ days), Medium (3-4), Low (<3)
- Use real medical patterns: morning surge, evening dip
`;

    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API key not found. Add NEXT_PUBLIC_OPENROUTER_KEY to .env.local");
      }

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "BP Forecast AI",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter Error ${res.status}: ${errText}`);
      }

      const result = await res.json();

      // SAFETY: Check if choices exist
      if (!result?.choices?.[0]?.message?.content) {
        throw new Error("No response from AI. Try again.");
      }

      const raw = result.choices[0].message.content.trim();

      // Extract JSON
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON.");
      }

      const prediction = JSON.parse(jsonMatch[0]);
      setForecast(prediction);

    } catch (err: any) {
      console.error("Forecast error:", err);
      setForecastError(err.message || "Prediction failed. Check API key.");
    } finally {
      setForecastLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            7-Day BP Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No readings in the last 7 days. Start tracking!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            7-Day BP Trend
          </CardTitle>
          {average && (
            <div className="text-sm text-gray-600">
              Avg: <span className="font-bold text-blue-600">{average.systolic}</span>/
              <span className="font-bold text-red-600">{average.diastolic}</span> mmHg
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[60, 180]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-semibold text-sm">{payload[0].payload.date}</p>
                      <p className="text-blue-600 text-sm">
                        Systolic: <strong>{payload[0].value}</strong> mmHg
                      </p>
                      <p className="text-red-600 text-sm">
                        Diastolic: <strong>{payload[1].value}</strong> mmHg
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Time: {payload[0].payload.time}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 6 }}
              activeDot={{ r: 8 }}
              name="Systolic"
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: "#ef4444", r: 6 }}
              activeDot={{ r: 8 }}
              name="Diastolic"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* FORECAST SECTION */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-600" />
            <h3 className="text-xl font-bold text-purple-800">AI BP Forecast for Tomorrow</h3>
          </div>

          <Button
            onClick={predictTomorrowBP}
            disabled={forecastLoading || data.length < 3}
            className="w-full mb-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold"
          >
            {forecastLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5 mr-2" />
                Predict Tomorrow's BP
              </>
            )}
          </Button>

          {forecastError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{forecastError}</AlertDescription>
            </Alert>
          )}

          {forecast && (
            <div className="space-y-4 text-center">
              <p className="text-2xl font-bold text-purple-800">
                Tomorrow (8 Nov 2025)
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-100 p-6 rounded-xl">
                  <p className="text-sm text-blue-600">Systolic</p>
                  <p className="text-4xl font-bold text-blue-800">
                    {forecast.tomorrowSystolic}
                  </p>
                </div>
                <div className="bg-red-100 p-6 rounded-xl">
                  <p className="text-sm text-red-600">Diastolic</p>
                  <p className="text-4xl font-bold text-red-800">
                    {forecast.tomorrowDiastolic}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <span className="bg-green-100 px-4 py-2 rounded-full font-medium">
                  {forecast.confidence}
                </span>
                <span className={`px-4 py-2 rounded-full font-medium ${
                  forecast.trend === "Rising" ? "bg-red-100 text-red-700" :
                  forecast.trend === "Falling" ? "bg-green-100 text-green-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {forecast.trend}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}