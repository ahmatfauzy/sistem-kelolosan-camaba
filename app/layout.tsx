import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, BarChart3 } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SYNCSELECT | SPK Kelolosan Camaba',
  description: 'Sistem Pendukung Keputusan Kelolosan Calon Mahasiswa Baru'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 right-0 shadow-sm z-50">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  SYNCSELECT
                </Link>
                <div className="flex items-center gap-2">
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>

          <div className="pt-[64px]">{children}</div>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
