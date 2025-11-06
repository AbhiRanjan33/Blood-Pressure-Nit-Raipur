// src/app/api/get-doctor-consult-by-id/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clerkId = searchParams.get('clerkId');

    if (!id || !clerkId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const doctor = await User.findOne({ clerkId, role: 'doctor' });
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const request = doctor.consultRequests.id(id);
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    return NextResponse.json({ request: request.toObject() });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}