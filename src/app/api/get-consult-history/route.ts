// src/app/api/get-consult-history/route.ts
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

    const user = await User.findOne({ clerkId }, { consultRequests: 1 });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ consultRequests: user.consultRequests || [] });
  } catch (err) {
    console.error('Get Consult History Error:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}