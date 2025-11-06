// src/app/api/save-doctor-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, name, registrationId, photoUrl, experience, hospitalName } = body;

    if (!clerkId || !name || !registrationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doctorProfile = {
  name: name.trim(),
  registrationId: registrationId.trim(),
  photoUrl: photoUrl || null,
  experience: Number(experience),
  hospitalName: hospitalName.trim(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $set: { doctorProfile } },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Doctor Profile Save Error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}