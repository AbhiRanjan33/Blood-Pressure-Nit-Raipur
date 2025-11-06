// src/app/api/get-doctor-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
      return NextResponse.json({ error: 'clerkId required' }, { status: 400 });
    }

    const user = await User.findOne({ clerkId }, { doctorProfile: 1 });
    if (!user || !user.doctorProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ doctorProfile: user.doctorProfile });
  } catch (err) {
    console.error('Get Doctor Profile Error:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}