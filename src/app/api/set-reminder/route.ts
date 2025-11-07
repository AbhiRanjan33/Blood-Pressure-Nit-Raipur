// src/app/api/set-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { clerkId, enabled, phone } = await req.json();

    if (!clerkId || !phone) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    await User.updateOne(
      { clerkId },
      { $set: { "bpReminder.enabled": enabled, "bpReminder.phone": phone } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}