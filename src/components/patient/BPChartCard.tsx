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
import { Activity, TrendingUp } from "lucide-react";

interface Reading {
  date: string;
  systolic: number;
  diastolic: number;
  time: string;
}

export default function BPChartCard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState<Reading[]>([]);
  const [average, setAverage] = useState<{ systolic: number; diastolic: number } | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Initial load
  useEffect(() => {
    if (isLoaded && user) {
      fetchReadings();
    }
  }, [isLoaded, user]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) fetchReadings();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

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
    <Card>
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
      <CardContent>
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
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 7 }}
              name="Systolic"
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: "#ef4444", r: 5 }}
              activeDot={{ r: 7 }}
              name="Diastolic"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}