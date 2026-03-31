'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Farm { id: string; name: string }
interface Employee { id: string; name: string }
interface ChemLog {
  id: string
  chemical_name: string
  mix_ratio: string
  quantity: string
  applied_by?: string
  date: string
  notes?: string
  farm_locations?: { name: string }
  employees?: { name: string }
}

export default function ChemicalsPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [logs, setLogs] = useState<ChemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    farm_id: '', chemical_name: '', mix_ratio: '', quantity: '',
    applied_by: '', date: new Date().toISOString().split('T')[0], notes: '',
  })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const [farmsRes, empsRes, logsRes] = await Promise.all([
      supabase.from('farm_locations').select('id, name').order('name'),
      supabase.from('employees').select('id, name').order('name'),
      supabase.from('chemical_logs')
        .select('*, farm_locations(name), employees(name)')
        .order('date', { ascending: false })
        .limit(50),
    ])
    setFarms(farmsRes.data || [])
    setEmployees(empsRes.data || [])
    setLogs(logsRes.data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()

    const { data } = await supabase.from('chemical_logs').insert({
      org_id: profile!.org_id,
      farm_id: form.farm_id,
      chemical_name: form.chemical_name,
      mix_ratio: form.mix_ratio,
      quantity: form.quantity,
      applied_by: form.applied_by || null,
      date: form.date,
      notes: form.notes,
    }).select('*, farm_locations(name), employees(name)').single()

    if (data) setLogs((prev) => [data, ...prev])
    setForm({
      farm_id: '', chemical_name: '', mix_ratio: '', quantity: '',
      applied_by: '', date: new Date().toISOString().split('T')[0], notes: '',
    })
    setSubmitting(false)
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: '0 0 16px' }}>🧪 Chemical Log</h2>

      {/* Log form */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>New Entry</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })} required>
            <option value="">Select farm</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input
            placeholder="Chemical name (e.g. Chlorine Dioxide)"
            value={form.chemical_name}
            onChange={(e) => setForm({ ...form, chemical_name: e.target.value })}
            required
          />
          <input
            placeholder="Mix ratio (e.g. 1:10 with water)"
            value={form.mix_ratio}
            onChange={(e) => setForm({ ...form, mix_ratio: e.target.value })}
          />
          <input
            placeholder="Quantity (e.g. 5L)"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <select value={form.applied_by} onChange={(e) => setForm({ ...form, applied_by: e.target.value })}>
            <option value="">Applied by (optional)</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <textarea
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            style={{ resize: 'vertical' }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              padding: '10px',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {submitting ? 'Logging...' : 'Log Chemical Application'}
          </button>
        </form>
      </div>

      {/* History */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>History</h3>
      {logs.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No entries yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {logs.map((log) => (
            <div key={log.id} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{log.chemical_name}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{log.date}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                🏡 {(log.farm_locations as { name: string } | undefined)?.name || '—'}
                {log.mix_ratio && <> · ⚗️ {log.mix_ratio}</>}
                {log.quantity && <> · 📦 {log.quantity}</>}
              </div>
              {log.applied_by && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  👤 {(log.employees as { name: string } | undefined)?.name || '—'}
                </div>
              )}
              {log.notes && (
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' }}>{log.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
