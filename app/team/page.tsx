'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Farm { id: string; name: string }
interface Employee { id: string; name: string; farm_id: string; role: string }

export default function TeamPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', farm_id: '', role: 'worker' })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.replace('/dashboard'); return }

    const [farmsRes, empsRes] = await Promise.all([
      supabase.from('farm_locations').select('id, name').order('name'),
      supabase.from('employees').select('*').order('name'),
    ])
    setFarms(farmsRes.data || [])
    setEmployees(empsRes.data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.farm_id) return
    setAdding(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()
    const { data } = await supabase.from('employees').insert({
      org_id: profile!.org_id,
      name: form.name,
      farm_id: form.farm_id,
      role: form.role,
    }).select('*').single()
    if (data) setEmployees((prev) => [...prev, data])
    setForm({ name: '', farm_id: '', role: 'worker' })
    setAdding(false)
  }

  const empsByFarm = (farmId: string) => employees.filter((e) => e.farm_id === farmId)

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: '0 0 16px' }}>👥 Team</h2>

      {/* Employees by farm */}
      {farms.map((farm) => (
        <div key={farm.id} style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: '#15803d',
            padding: '6px 12px',
            borderRadius: '6px 6px 0 0',
            margin: 0,
          }}>
            🏡 {farm.name}
          </h3>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
          }}>
            {empsByFarm(farm.id).length === 0 ? (
              <p style={{ color: '#9ca3af', padding: '10px 12px', fontSize: 13, margin: 0 }}>No employees assigned.</p>
            ) : (
              empsByFarm(farm.id).map((emp) => (
                <div key={emp.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderBottom: '1px solid #f3f4f6',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{emp.name}</div>
                  </div>
                  <span style={{
                    backgroundColor: emp.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                    color: emp.role === 'admin' ? '#1d4ed8' : '#6b7280',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    textTransform: 'capitalize',
                  }}>
                    {emp.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Add employee */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>+ Add Employee</h3>
        <form onSubmit={addEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })} required>
            <option value="">Assign to farm</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="worker">Worker</option>
            <option value="admin">Manager</option>
          </select>
          <button
            type="submit"
            disabled={adding}
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
            {adding ? 'Adding...' : 'Add Employee'}
          </button>
        </form>
      </div>
    </div>
  )
}
