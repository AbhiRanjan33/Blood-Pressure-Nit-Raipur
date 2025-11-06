// src/app/api/submit-consult/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { clerkId, vitals, allergies, notes, medications } = await req.json();

    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const newRequest = {
      vitals,
      allergies,
      notes,
      medications,
      status: 'pending',
      createdAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $push: { consultRequests: newRequest } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requestId = updatedUser.consultRequests[updatedUser.consultRequests.length - 1]._id;

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error('Submit consult error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}