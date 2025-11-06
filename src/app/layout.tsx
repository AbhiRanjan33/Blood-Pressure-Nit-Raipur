// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { startDailyFitSaver } from '@/lib/dailyFitSaver'; // ← Import

const inter = Inter({ subsets: ['latin'] });

// ← RUN CRON ON SERVER START (NO useEffect!)
if (typeof window === 'undefined') {
  startDailyFitSaver();
}

export const metadata = {
  title: 'BP Health AI',
  description: 'AI-Powered Blood Pressure Management with Doctor Oversight',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}