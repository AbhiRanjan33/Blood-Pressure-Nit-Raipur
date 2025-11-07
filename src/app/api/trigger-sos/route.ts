// src/app/api/trigger-sos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { clerkId, bp } = await req.json();

    const user = await User.findOne({ clerkId });
    if (!user || !user.profile?.emergencyContacts) {
      return NextResponse.json({ error: "No emergency contacts" }, { status: 400 });
    }

    const contacts = user.profile.emergencyContacts
      .filter((c: any) => c.phone && c.phone.length === 10)
      .map((c: any) => `+91${c.phone}`);

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid numbers" }, { status: 400 });
    }

    const res = await fetch("http://127.0.0.1:5001/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numbers: contacts,
        name: user.profile.name || "Patient",
        bp: bp || "Critical"
      }),
    });

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}