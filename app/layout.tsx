import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Money Tracker',
  description: 'Track your daily expenses with Google Sheets as backend',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
