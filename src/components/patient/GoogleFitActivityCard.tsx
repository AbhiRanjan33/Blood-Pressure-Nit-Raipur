"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn, signOut } from "next-auth/react";
import { Activity, HeartPulse, Flame, Clock, Gauge } from "lucide-react";

interface FitData {
  steps: number;
  heartPoints: number;
  calories: number;
  moveMinutes: number;
}

export default function GoogleFitActivityCard() {
  const { data: session, status } = useSession();
  const [rawData, setRawData] = useState<FitData>({ steps: 0, heartPoints: 0, calories: 0, moveMinutes: 0 });
  const [loading, setLoading] = useState(false);

  // Derived values
  const distance = rawData.steps * 0.0007; // km
  const speed = rawData.moveMinutes > 0 ? (distance / (rawData.moveMinutes / 60)) : 0; // km/h

  const fetchActivity = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/google-fit-data');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setRawData(result);
    } catch (err) {
      console.error('Fit Data Error:', err);
      setRawData({ steps: 0, heartPoints: 0, calories: 0, moveMinutes: 0 });
      // Inside fetchActivity(), after setRawData
useEffect(() => {
  if (session && rawData.steps > 0) {
    const calculatedDistance = rawData.steps * 0.0007;
    const calculatedSpeed = rawData.moveMinutes > 0 ? (calculatedDistance / (rawData.moveMinutes / 60)) : 0;

    // Send to backend cache
    fetch('/api/update-fit-cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: session.user.clerkId,
        steps: rawData.steps,
        heartPoints: rawData.heartPoints,
        calories: rawData.calories,
        distance: calculatedDistance,
        moveMinutes: rawData.moveMinutes,
        speed: calculatedSpeed,
      }),
    });
  }
}, [rawData, session]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchActivity();
      const interval = setInterval(fetchActivity, 300000); // 5 mins
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Google Fit Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "loading" ? (
          <p className="text-center py-4">Loading session...</p>
        ) : !session ? (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => signIn("google", { callbackUrl: "/dashboard/patient" })}
          >
            Connect Google Fit
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => signOut({ callbackUrl: "/dashboard/patient" })}
            >
              Disconnect
            </Button>

            {loading ? (
              <p className="text-center text-sm text-gray-500">Updating data...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-center">
                {/* Steps */}
                <div className="p-3 border rounded-lg bg-blue-50">
                  <Activity className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">{rawData.steps.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Steps</p>
                </div>

                {/* Heart Points */}
                <div className="p-3 border rounded-lg bg-red-50">
                  <HeartPulse className="h-5 w-5 text-red-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">{rawData.heartPoints}</p>
                  <p className="text-xs text-gray-600">Heart Points</p>
                </div>

                {/* Total Calories */}
                <div className="p-3 border rounded-lg bg-orange-50">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-orange-500">{rawData.calories.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Total Calories</p>
                </div>

                {/* Distance (Calculated) */}
                <div className="p-3 border rounded-lg bg-green-50">
                  <svg className="h-5 w-5 text-green-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-lg font-bold text-green-600">{distance.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">KM (Est.)</p>
                </div>

                {/* Move Minutes */}
                <div className="p-3 border rounded-lg bg-purple-50">
                  <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-600">{rawData.moveMinutes}</p>
                  <p className="text-xs text-gray-600">Move Minutes</p>
                </div>

                {/* Speed (Calculated) */}
                <div className="p-3 border rounded-lg bg-indigo-50">
                  <Gauge className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-indigo-600">{speed.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">Avg Speed km/h</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}