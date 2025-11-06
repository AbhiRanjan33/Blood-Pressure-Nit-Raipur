// src/app/api/bp-comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
      return NextResponse.json({ error: 'clerkId required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ clerkId }).select('bpReadings').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const comments = user.bpReadings
      .filter((r: any) => new Date(r.createdAt) >= sevenDaysAgo)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // newest first
      .map((r: any) => ({
        time: r.time,
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        notes: r.notes || '—',
        createdAt: r.createdAt,
      }));

    return NextResponse.json({ comments });
  } catch (err) {
    console.error('BP Comments Error:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}