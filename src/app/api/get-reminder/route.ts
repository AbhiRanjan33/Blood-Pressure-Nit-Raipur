// src/app/api/get-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");
    if (!clerkId) return NextResponse.json({ error: "clerkId required" }, { status: 400 });

    const user = await User.findOne({ clerkId });
    if (!user) return NextResponse.json({ reminder: null });

    return NextResponse.json({
      reminder: {
        enabled: user.bpReminder?.enabled || false,
        phone: user.bpReminder?.phone || "",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}