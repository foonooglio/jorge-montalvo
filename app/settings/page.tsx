'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Farm { id: string; name: string; created_at: string }

export default function SettingsPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newFarmName, setNewFarmName] = useState('')
  const [lang, setLang] = useState('en')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data } = await supabase.from('farm_locations').select('*').order('name')
    setFarms(data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const addFarm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFarmName.trim()) return
    setAdding(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()
    const { data } = await supabase.from('farm_locations').insert({
      org_id: profile!.org_id,
      name: newFarmName.trim(),
    }).select('*').single()
    if (data) setFarms((prev) => [...prev, data])
    setNewFarmName('')
    setAdding(false)
  }

  const removeFarm = async (farmId: string) => {
    if (!confirm('Remove this farm location? Tasks and employees assigned to it will be unaffected.')) return
    const supabase = createClient()
    await supabase.from('farm_locations').delete().eq('id', farmId)
    setFarms((prev) => prev.filter((f) => f.id !== farmId))
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: '0 0 20px' }}>⚙️ Settings</h2>

      {/* Farm locations */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Farm Locations</h3>
        {farms.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>No farms yet.</p>
        ) : (
          <div style={{ marginBottom: 12 }}>
            {farms.map((farm) => (
              <div key={farm.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <span style={{ fontSize: 14, color: '#111827' }}>🏡 {farm.name}</span>
                <button
                  onClick={() => removeFarm(farm.id)}
                  style={{
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={addFarm} style={{ display: 'flex', gap: 8 }}>
          <input
            placeholder="New farm name"
            value={newFarmName}
            onChange={(e) => setNewFarmName(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <button
            type="submit"
            disabled={adding}
            style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {adding ? '...' : '+ Add'}
          </button>
        </form>
      </div>

      {/* Language toggle */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Language</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['en', 'es'].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                backgroundColor: lang === l ? '#15803d' : '#f3f4f6',
                color: lang === l ? '#ffffff' : '#374151',
                border: `1px solid ${lang === l ? '#15803d' : '#d1d5db'}`,
                borderRadius: 6,
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {l === 'en' ? '🇺🇸 English' : '🇵🇷 Español'}
            </button>
          ))}
        </div>
        <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>Full translation coming in next version.</p>
      </div>

      {/* App info */}
      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#15803d', margin: '0 0 8px' }}>App Info</h3>
        <p style={{ fontSize: 13, color: '#374151', margin: '0 0 4px' }}>Iglesias Dairy Farm Manager</p>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Version: DEMO #1 · Built by Grosslight Consulting</p>
      </div>
    </div>
  )
}
