// src/app/api/get-patient-profile/route.ts
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

    const user = await User.findOne({ clerkId }, { profile: 1 });
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: user.profile });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}