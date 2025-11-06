import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
  try {
    const { clerkId, email, role } = await req.json();

    if (!clerkId || !email || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await connectDB();

    // Upsert: Create if new, update if exists
    const user = await User.findOneAndUpdate(
      { clerkId },
      { clerkId, email, role },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}