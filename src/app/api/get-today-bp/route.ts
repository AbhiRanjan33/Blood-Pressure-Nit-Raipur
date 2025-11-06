// src/app/api/get-today-bp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');
    const date = searchParams.get('date');

    if (!clerkId || !date) {
      return NextResponse.json({ error: 'clerkId and date required' }, { status: 400 });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find today's reading (latest if multiple)
    const todayReading = user.bpReadings
      .filter((r: any) => r.date === date)
      .sort((a: any, b: any) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    if (!todayReading) {
      return NextResponse.json({ error: 'No BP reading for today' }, { status: 404 });
    }

    return NextResponse.json({ reading: todayReading });
  } catch (err) {
    console.error('Get Today BP Error:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}