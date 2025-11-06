// src/app/api/get-patient-consults/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ requests: [] });
    }

    const user = await User.findOne(
      { clerkId, role: "patient" },
      { consultRequests: 1 }
    );

    if (!user) {
      return NextResponse.json({ requests: [] });
    }

    const requests = user.consultRequests || [];

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get patient consults error:", error);
    return NextResponse.json({ requests: [] });
  }
}