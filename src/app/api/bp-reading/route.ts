// src/app/api/bp-reading/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, date, time, systolic, diastolic, sleepQuality, stressLevel, notes } = body;

    if (!clerkId || !date || !time || systolic == null || diastolic == null || sleepQuality == null || stressLevel == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reading = {
      date,
      time,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      sleepQuality: Number(sleepQuality),
      stressLevel: Number(stressLevel),
      notes,
      createdAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $push: { bpReadings: reading } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, reading });
  } catch (err) {
    console.error('BP Save Error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}