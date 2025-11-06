import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'No webhook secret' }, { status: 400 });
  }

  const payload = await req.text();
  const heads = headers();
  const svixHeaders: Record<string, string> = {};
  heads.forEach((value, key) => {
    if (key.startsWith('svix-')) svixHeaders[key] = value;
  });

  try {
    const wh = new Webhook(webhookSecret);
    const evt = wh.verify(payload, svixHeaders) as any;

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { id: clerkId, email_addresses, unsafe_metadata } = evt.data;
      const email = email_addresses[0]?.email_address;
      const role = unsafe_metadata?.role;

      if (!clerkId || !email) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

      await connectDB();
      await User.findOneAndUpdate(
        { clerkId },
        { clerkId, email, role },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
}