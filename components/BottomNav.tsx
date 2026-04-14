'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/worker', label: 'My Tasks', icon: '✓' },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      zIndex: 50,
    }}>
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              color: active ? '#15803d' : '#6b7280',
              fontWeight: active ? 600 : 400,
              fontSize: 11,
              minHeight: 56,
              borderBottom: active ? '2px solid #15803d' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
