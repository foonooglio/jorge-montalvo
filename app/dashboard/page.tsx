'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Farm { id: string; name: string; location: string }
interface Employee { id: string; name: string; farm_id: string }
interface Task {
  id: string
  title: string
  status: string
  date: string
  assigned_to: string
  farm_id: string
  notes?: string
  prg_employees?: { name: string }
  prg_farms?: { name: string }
}

export default function DashboardPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedFarm, setSelectedFarm] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', assigned_to: '', farm_id: '', notes: '' })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const today = new Date().toISOString().split('T')[0]

    const [farmsRes, empsRes, tasksRes] = await Promise.all([
      supabase.from('prg_farms').select('id, name, location').order('name'),
      supabase.from('prg_employees').select('id, name, farm_id').order('name'),
      supabase.from('prg_tasks')
        .select('*, prg_employees(name), prg_farms(name)')
        .eq('date', today)
        .order('created_at'),
    ])

    setFarms(farmsRes.data || [])
    setEmployees(empsRes.data || [])
    setTasks(tasksRes.data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  const today = new Date().toISOString().split('T')[0]

  const filteredTasks = selectedFarm
    ? tasks.filter((t) => t.farm_id === selectedFarm)
    : tasks

  const tasksDone = tasks.filter((t) => t.status === 'done').length
  const tasksTotal = tasks.length

  // Per-farm summary
  const farmSummary = farms.map((farm) => {
    const farmEmps = employees.filter((e) => e.farm_id === farm.id).length
    const farmTasks = tasks.filter((t) => t.farm_id === farm.id)
    const done = farmTasks.filter((t) => t.status === 'done').length
    return { ...farm, empCount: farmEmps, done, total: farmTasks.length }
  })

  const toggleTask = async (task: Task) => {
    const next = task.status === 'done' ? 'pending' : 'done'
    const supabase = createClient()
    await supabase.from('prg_tasks').update({ status: next }).eq('id', task.id)
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t))
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title || !newTask.assigned_to || !newTask.farm_id) return
    setAddingTask(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user!.id).single()
    const { data } = await supabase.from('prg_tasks').insert({
      org_id: profile!.org_id,
      title: newTask.title,
      assigned_to: newTask.assigned_to,
      farm_id: newTask.farm_id,
      notes: newTask.notes || null,
      date: today,
      status: 'pending',
    }).select('*, prg_employees(name), prg_farms(name)').single()
    if (data) setTasks((prev) => [...prev, data])
    setNewTask({ title: '', assigned_to: '', farm_id: '', notes: '' })
    setAddingTask(false)
  }

  const filteredEmployees = newTask.farm_id
    ? employees.filter((e) => e.farm_id === newTask.farm_id)
    : employees

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Loading dashboard...</div>
  }

  return (
    <div style={{ padding: '16px', backgroundColor: '#f9fafb', minHeight: '100%' }}>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>{employees.length}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Workers</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{tasksDone}/{tasksTotal}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Tasks Done Today</div>
        </div>
      </div>

      {/* Farm cards */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>🏡 Farms</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {farmSummary.map((farm) => (
          <div key={farm.id} style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{farm.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{farm.location}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#374151' }}>👤 {farm.empCount} workers</div>
              <div style={{ fontSize: 12, color: '#059669' }}>✅ {farm.done}/{farm.total} tasks</div>
            </div>
          </div>
        ))}
      </div>

      {/* Task list with filter */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: 0 }}>📋 Today&apos;s Tasks</h3>
        </div>
        <select
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          style={{ marginBottom: 10 }}
        >
          <option value="">All Farms</option>
          {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {filteredTasks.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 16 }}>No tasks for today yet.</p>
          )}
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task)}
              style={{
                backgroundColor: task.status === 'done' ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${task.status === 'done' ? '#a7f3d0' : '#e5e7eb'}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18, marginTop: 1 }}>{task.status === 'done' ? '✅' : '⬜'}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: task.status === 'done' ? '#6b7280' : '#111827',
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                }}>
                  {task.title}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  👤 {(task.prg_employees as { name: string } | undefined)?.name || '—'} &nbsp;·&nbsp; 🏡 {(task.prg_farms as { name: string } | undefined)?.name || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add task */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>+ Add Task for Today</h3>
        <form onSubmit={addTask} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <select
            value={newTask.farm_id}
            onChange={(e) => setNewTask({ ...newTask, farm_id: e.target.value, assigned_to: '' })}
            required
          >
            <option value="">Select farm</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select
            value={newTask.assigned_to}
            onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
            required
          >
            <option value="">Assign to worker</option>
            {filteredEmployees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
          </select>
          <input
            placeholder="Notes (optional)"
            value={newTask.notes}
            onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
          />
          <button
            type="submit"
            disabled={addingTask}
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
            {addingTask ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '12px 8px',
  textAlign: 'center',
}
