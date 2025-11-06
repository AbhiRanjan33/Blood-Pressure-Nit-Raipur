// src/app/api/bp-summary/route.ts
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

    const readings = user.bpReadings
      .filter((r: any) => new Date(r.createdAt) >= sevenDaysAgo)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((r: any) => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        systolic: r.systolic,
        diastolic: r.diastolic,
        time: r.time,
      }));

    const avg = readings.reduce(
      (acc: any, r: any) => {
        acc.systolic += r.systolic;
        acc.diastolic += r.diastolic;
        return acc;
      },
      { systolic: 0, diastolic: 0 }
    );

    const count = readings.length;
    const average = count > 0
      ? {
          systolic: Math.round(avg.systolic / count),
          diastolic: Math.round(avg.diastolic / count),
        }
      : null;

    return NextResponse.json({ readings, average });
  } catch (err) {
    console.error('BP Summary Error:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}