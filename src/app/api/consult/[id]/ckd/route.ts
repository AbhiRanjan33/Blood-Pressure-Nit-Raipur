// src/app/api/consult/[id]/ckd/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    // Find doctor who has this consult request
    const doctor = await User.findOne({
      role: 'doctor',
      'consultRequests._id': id,
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Consult not found' }, { status: 404 });
    }

    const consult = doctor.consultRequests.id(id);
    if (!consult) {
      return NextResponse.json({ error: 'Consult not found' }, { status: 404 });
    }

    return NextResponse.json({ hasCKD: !!consult.hasCKD });
  } catch (err: any) {
    console.error('CKD fetch error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}