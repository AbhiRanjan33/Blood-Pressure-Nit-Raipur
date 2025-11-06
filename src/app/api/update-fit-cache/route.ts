// src/app/api/update-fit-cache/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateTodayData } from '@/lib/dailyFitSaver';

export async function POST(req: NextRequest) {
  const body = await req.json();
  updateTodayData(body.clerkId, body);
  return NextResponse.json({ success: true });
}