// src/app/api/update-doctor-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, name, registrationId, photoUrl, experience, hospitalName } = body;

    if (!clerkId || !name || !registrationId || experience === undefined || !hospitalName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doctorProfile = {
      name: name.trim(),
      registrationId: registrationId.trim(),
      photoUrl: photoUrl || null,
      experience: Number(experience),
      hospitalName: hospitalName.trim(),
      updatedAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $set: { doctorProfile } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, doctorProfile: updatedUser.doctorProfile });
  } catch (err) {
    console.error('Update Doctor Profile Error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}