// src/app/api/update-patient-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, ...profileData } = body;

    if (!clerkId) {
      return NextResponse.json({ error: 'clerkId required' }, { status: 400 });
    }

    const profile = {
      ...profileData,
      age: Number(profileData.age),
      height: Number(profileData.height),
      weight: Number(profileData.weight),
      updatedAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $set: { profile } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Profile updated for ${clerkId}`);
    return NextResponse.json({ success: true, profile: updatedUser.profile });
  } catch (err) {
    console.error('Update Profile Error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}