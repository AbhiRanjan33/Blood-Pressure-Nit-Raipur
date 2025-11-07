// src/components/patient/GoogleFitActivityCard.tsx
"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signIn, signOut } from "next-auth/react";
import { Activity, HeartPulse, Flame, Clock, Gauge } from "lucide-react";

export default function GoogleFitActivityCard() {
  const { data: session, status } = useSession();

  // HARDCODED DATA — CHANGE THESE FOR DEMO
  const data = {
    steps: 2345,
    heartPoints: 1,
    calories: 847,
    moveMinutes: 25,
    distance: "1.36",     // km
    speed: "1.2",         // km/h
  };

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
              onClick={() => signOut({ callbackCallback: "/dashboard/patient" })}
            >
              Disconnect
            </Button>

            {/* FULLY STATIC — NO CALCULATIONS */}
            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Steps */}
              <div className="p-3 border rounded-lg bg-blue-50">
                <Activity className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-600">{data.steps.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Steps</p>
              </div>

              {/* Heart Points */}
              <div className="p-3 border rounded-lg bg-red-50">
                <HeartPulse className="h-5 w-5 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-600">{data.heartPoints}</p>
                <p className="text-xs text-gray-600">Heart Points</p>
              </div>

              {/* Calories */}
              <div className="p-3 border rounded-lg bg-orange-50">
                <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-orange-500">{data.calories.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Calories</p>
              </div>

              {/* Distance — HARDCODED */}
              <div className="p-3 border rounded-lg bg-green-50">
                <svg className="h-5 w-5 text-green-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-lg font-bold text-green-600">{data.distance}</p>
                <p className="text-xs text-gray-600">KM</p>
              </div>

              {/* Move Minutes */}
              <div className="p-3 border rounded-lg bg-purple-50">
                <Clock className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-purple-600">{data.moveMinutes}</p>
                <p className="text-xs text-gray-600">Move Minutes</p>
              </div>

              {/* Speed — HARDCODED */}
              <div className="p-3 border rounded-lg bg-indigo-50">
                <Gauge className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-indigo-600">{data.speed}</p>
                <p className="text-xs text-gray-600">km/h</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}