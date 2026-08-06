import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/auth-provider';
import './globals.css';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: {
    default: 'SiteFlow',
    template: '%s | SiteFlow',
  },
  description:
    'Construction issue management platform',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  redirect('/login');
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}