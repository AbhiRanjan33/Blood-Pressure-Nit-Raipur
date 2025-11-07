// src/app/api/patient/emergency-contacts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get clerkId from query params (sent from frontend)
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
      return NextResponse.json({ error: 'clerkId required' }, { status: 400 });
    }

    const user = await User.findOne({ clerkId });
    if (!user || user.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({
      emergencyContacts: user.profile?.emergencyContacts || [
        { name: "Emergency Contact 1", phone: "" },
        { name: "Emergency Contact 2", phone: "" }
      ],
    });
  } catch (err: any) {
    console.error('GET Emergency Contacts Error:', err);
    return NextResponse.json({ 
      error: 'Server error', 
      details: err.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, emergencyContacts } = body;

    if (!clerkId) {
      return NextResponse.json({ error: 'clerkId required' }, { status: 400 });
    }

    if (!emergencyContacts || emergencyContacts.length !== 2) {
      return NextResponse.json({ error: 'Exactly 2 contacts required' }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId, role: 'patient' },
      { 
        $set: { 
          'profile.emergencyContacts': emergencyContacts,
          'profile.updatedAt': new Date()
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    console.log(`Emergency contacts saved for ${clerkId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST Emergency Contacts Error:', err);
    return NextResponse.json({ 
      error: 'Failed to save', 
      details: err.message 
    }, { status: 500 });
  }
}