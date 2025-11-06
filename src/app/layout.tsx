// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';
import { startDailyFitSaver } from '@/lib/dailyFitSaver';

const inter = Inter({ subsets: ['latin'] });

// Run cron only on server
if (typeof window === 'undefined') {
  startDailyFitSaver();
}

export const metadata = {
  title: 'BP Health AI',
  description: 'AI-Powered Blood Pressure Management with Doctor Oversight',
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* Google Translate Script */}
          <script
            type="text/javascript"
            src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            async
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                function googleTranslateElementInit() {
                  // Widget is ready
                }
              `
            }}
          />
        </head>
        <body className={inter.className}>
          <ClientProviders>
            {children}
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}