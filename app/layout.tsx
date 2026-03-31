import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import AuthGuard from '@/components/AuthGuard'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'Iglesias Dairy — Farm Manager',
  description: 'Farm management for Iglesias Dairy',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Iglesias Dairy',
  },
}

export const viewport: Viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#ffffff', maxWidth: 480, margin: '0 auto' }}>
        <ServiceWorkerRegistrar />
        <AuthGuard>
          <Header />
          <main style={{ paddingBottom: 72, minHeight: '100vh', backgroundColor: '#ffffff' }}>
            {children}
          </main>
          <BottomNav />
        </AuthGuard>
      </body>
    </html>
  )
}
