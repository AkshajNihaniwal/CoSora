import type { Metadata } from 'next';
import { EB_Garamond } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import './globals.css';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CoSora — Legal AI Platform',
  description: 'Enterprise legal department AI automation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={ebGaramond.variable}>
      <body className="font-serif bg-cosora-black text-cosora-light antialiased">
        <AuthProvider>
          <SocketProvider>{children}</SocketProvider>
        </AuthProvider>
        <Toaster theme="dark" position="top-right" />
      </body>
    </html>
  );
}
