// src/app/api/get-patient-full-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

// MUST be named GET (uppercase G, lowercase ET)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ error: "clerkId required" }, { status: 400 });
    }

    const user = await User.findOne({ clerkId }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // All BP readings
    const allBpReadings = (user.bpReadings || []).map((r: any) => ({
      date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: r.time || "12:00 PM",
      systolic: r.systolic,
      diastolic: r.diastolic,
    }));

    allBpReadings.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // All consults
    const allConsults = (user.consultRequests || []).map((c: any) => ({
      _id: c._id.toString(),
      reason: c.reason || "General Health Check",
      status: c.status || "unknown",
      createdAt: new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      completedAt: c.completedAt ? new Date(c.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : undefined,
    }));

    allConsults.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      profile: user.profile || {},
      bpReadings: allBpReadings,
      consults: allConsults,
    });
  } catch (err) {
    console.error("Get Full Patient Data Error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}