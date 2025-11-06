// src/app/api/save-fit-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date, steps, heartPoints, calories, distance, moveMinutes, speed } = await req.json();

    const user = await User.findOne({ clerkId: session.user.clerkId });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Avoid duplicates
    const exists = user.fitData.some((d: any) => d.date === date);
    if (exists) {
      return NextResponse.json({ message: 'Already saved for today' });
    }

    user.fitData.push({
      date,
      steps,
      heartPoints,
      calories,
      distance,
      moveMinutes,
      speed,
    });

    await user.save();
    console.log(`Fit data saved for ${session.user.email} on ${date}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Fit Data Error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}