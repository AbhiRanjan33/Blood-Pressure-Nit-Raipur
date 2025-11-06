// src/lib/dailyFitSaver.ts
import cron from 'node-cron';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Cache today's final data per user
const todayData: Map<string, any> = new Map();

export function updateTodayData(clerkId: string, data: any) {
  todayData.set(clerkId, { ...data, date: getTodayDate() });
}

export function startDailyFitSaver() {
  // Run at 11:59 PM every day
  cron.schedule('59 23 * * *', async () => {
    console.log('Running daily Fit data save...');
    await connectDB();

    for (const [clerkId, fitData] of todayData.entries()) {
      try {
        const user = await User.findOne({ clerkId });
        if (!user) continue;

        const exists = user.fitData.some((d: any) => d.date === fitData.date);
        if (exists) continue;

        user.fitData.push(fitData);
        await user.save();
        console.log(`Saved Fit data for ${clerkId} on ${fitData.date}`);
      } catch (error) {
        console.error(`Failed to save for ${clerkId}:`, error);
      }
    }

    // Clear cache for next day
    todayData.clear();
  });

  console.log('Daily Fit saver scheduled at 11:59 PM');
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}