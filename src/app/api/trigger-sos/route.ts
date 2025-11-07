// src/app/api/trigger-sos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    console.log('🚨 SOS TRIGGER STARTED');

    await connectDB();
    const body = await req.json();
    console.log('📱 Request Body:', body);

    const { clerkId, bp } = body;

    if (!clerkId) {
      return NextResponse.json({ error: "No clerkId provided" }, { status: 400 });
    }

    console.log('🔍 Finding user:', clerkId);
    const user = await User.findOne({ clerkId });
    console.log('👤 User found:', !!user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('📋 User profile:', user.profile);

    if (!user.profile?.emergencyContacts) {
      return NextResponse.json({ error: "No emergency contacts set" }, { status: 400 });
    }

    const contacts = user.profile.emergencyContacts
      .filter((c: any) => c.phone && c.phone.trim().length === 10)
      .map((c: any) => `+91${c.phone.trim()}`);

    console.log('📞 Contacts found:', contacts);

    if (contacts.length === 0) {
      return NextResponse.json({ error: "No valid phone numbers found" }, { status: 400 });
    }

    const sosData = {
      numbers: contacts,
      name: user.profile.name || "Patient",
      bp: bp || "Critical",
    };

    console.log('📡 Sending to Flask:', sosData);

    const flaskRes = await fetch("http://127.0.0.1:5001/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sosData),
    });

    console.log('🤖 Flask Response Status:', flaskRes.status);
    const flaskData = await flaskRes.json();
    console.log('🤖 Flask Response Data:', flaskData);

    if (!flaskRes.ok) {
      return NextResponse.json({ 
        error: `Flask error: ${flaskRes.status}`,
        flaskData 
      }, { status: 502 });
    }

    return NextResponse.json(flaskData);

  } catch (err: any) {
    console.error('💥 FULL SOS ERROR:', {
      message: err.message,
      stack: err.stack,
      body: await req.json().catch(() => 'Failed to parse body'),
    });
    return NextResponse.json({ 
      error: "Internal server error",
      details: err.message 
    }, { status: 500 });
  }
}