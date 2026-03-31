'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Farm { id: string; name: string }
interface Employee { id: string; name: string; farm_id: string }
interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  date: string
  employee_id: string
  farm_id: string
  notes?: string
  employees?: { name: string }
  farm_locations?: { name: string }
}

const COLUMNS = [
  { key: 'todo', label: 'Todo', color: '#e5e7eb', textColor: '#374151' },
  { key: 'in_progress', label: 'In Progress', color: '#fef3c7', textColor: '#92400e' },
  { key: 'done', label: 'Done', color: '#d1fae5', textColor: '#065f46' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedFarm, setSelectedFarm] = useState('')
  const [loading, setLoading] = useState(true)
  const [addingTask, setAddingTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', employee_id: '', farm_id: '', notes: '' })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'worker') {
      router.replace('/dashboard/worker')
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const [farmsRes, empsRes, tasksRes] = await Promise.all([
      supabase.from('farm_locations').select('id, name').order('name'),
      supabase.from('employees').select('id, name, farm_id').order('name'),
      supabase.from('daily_tasks')
        .select('*, employees(name), farm_locations(name)')
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

  const tasksByStatus = (status: string) => filteredTasks.filter((t) => t.status === status)

  const totalEmployees = employees.length
  const tasksDone = tasks.filter((t) => t.status === 'done').length
  const tasksPending = tasks.filter((t) => t.status !== 'done').length

  const advanceStatus = async (task: Task) => {
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'done'
    const supabase = createClient()
    await supabase.from('daily_tasks').update({ status: next }).eq('id', task.id)
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next as Task['status'] } : t))
  }

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.title || !newTask.employee_id || !newTask.farm_id) return
    setAddingTask(true)
    const supabase = createClient()
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    const { data } = await supabase.from('daily_tasks').insert({
      org_id: profile!.org_id,
      title: newTask.title,
      employee_id: newTask.employee_id,
      farm_id: newTask.farm_id,
      notes: newTask.notes,
      date: today,
      status: 'todo',
    }).select('*, employees(name), farm_locations(name)').single()
    if (data) setTasks((prev) => [...prev, data])
    setNewTask({ title: '', employee_id: '', farm_id: '', notes: '' })
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
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#15803d' }}>{totalEmployees}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Employees</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{tasksDone}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Done</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#d97706' }}>{tasksPending}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Pending</div>
        </div>
      </div>

      {/* Farm filter */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          style={{ marginBottom: 0 }}
        >
          <option value="">All Farms</option>
          {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Kanban */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20 }}>
        {COLUMNS.map((col) => (
          <div key={col.key} style={{
            flex: '0 0 150px',
            minWidth: 150,
          }}>
            <div style={{
              backgroundColor: col.color,
              color: col.textColor,
              padding: '6px 10px',
              borderRadius: '6px 6px 0 0',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
            }}>
              {col.label} ({tasksByStatus(col.key).length})
            </div>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              padding: 8,
              minHeight: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {tasksByStatus(col.key).map((task) => (
                <div
                  key={task.id}
                  onClick={() => advanceStatus(task)}
                  style={{
                    backgroundColor: col.key === 'done' ? '#f0fdf4' : '#f9fafb',
                    border: '1px solid ' + col.color,
                    borderRadius: 6,
                    padding: '8px 10px',
                    cursor: task.status !== 'done' ? 'pointer' : 'default',
                    transition: 'transform 0.1s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    👤 {(task.employees as { name: string } | undefined)?.name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    🏡 {(task.farm_locations as { name: string } | undefined)?.name || '—'}
                  </div>
                  {task.status !== 'done' && (
                    <div style={{ fontSize: 10, color: '#15803d', marginTop: 4, fontStyle: 'italic' }}>
                      Tap to advance →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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
            onChange={(e) => setNewTask({ ...newTask, farm_id: e.target.value, employee_id: '' })}
            required
          >
            <option value="">Select farm</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select
            value={newTask.employee_id}
            onChange={(e) => setNewTask({ ...newTask, employee_id: e.target.value })}
            required
          >
            <option value="">Assign to employee</option>
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
