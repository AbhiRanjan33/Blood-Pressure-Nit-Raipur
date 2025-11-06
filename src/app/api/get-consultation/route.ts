// src/app/api/get-consultation/route.ts
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
      return NextResponse.json({ error: 'ID and clerkId required' }, { status: 400 });
    }

    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the request by ID
    const request = user.consultRequests.find((r: any) => r._id.toString() === id);
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (err) {
    console.error('Get Consult Error:', err);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}