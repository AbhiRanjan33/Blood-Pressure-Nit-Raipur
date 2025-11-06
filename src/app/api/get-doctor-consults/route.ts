// src/app/api/get-doctor-consults/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get('clerkId');

    if (!clerkId) {
    }

    // CRITICAL: Only find DOCTOR with this clerkId
    const doctor = await User.findOne({ 
      clerkId, 
      role: 'doctor'   // ← THIS IS THE FIX
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found or not authorized' }, { status: 404 });
    }

    // Filter valid + sort newest first
    const validRequests = doctor.consultRequests
      .filter((req: any) => req.vitals && req.vitals.trim())
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ requests: validRequests });
  } catch (err) {
    console.error('Get doctor consults error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}