/**
 * @file layout.tsx
 * @description Root application layout wrapping all routes inside the DashboardShell.
 */

import type { Metadata } from 'next';
import './globals.css';
import DashboardShell from '@/components/DashboardShell';

export const metadata: Metadata = {
  title: 'SYNVORA OS — All-in-One Business & Social Commerce Platform',
  description: 'Unified platform for multi-channel social publishing, orders, courier fulfillment, P&L analytics, and AI business intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}