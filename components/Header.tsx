'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/login') return null

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <header style={{
      backgroundColor: '#15803d',
      color: '#ffffff',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      maxWidth: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>🌾</span>
        <span style={{ fontWeight: 700, fontSize: 17 }}>PR Greens</span>
        <span style={{
          backgroundColor: '#ffffff',
          color: '#15803d',
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 999,
          letterSpacing: '0.03em',
        }}>DEMO #1</span>
      </div>
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        Logout
      </button>
    </header>
  )
}
