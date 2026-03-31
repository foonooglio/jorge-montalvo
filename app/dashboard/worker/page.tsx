'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  date: string
  notes?: string
  farm_locations?: { name: string }
}

export default function WorkerDashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [workerName, setWorkerName] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    setWorkerName(profile?.full_name || 'Worker')

    // Worker: filter tasks to this user (by email matching employee record isn't set up, so show all for now)
    const { data: taskData } = await supabase
      .from('daily_tasks')
      .select('*, farm_locations(name)')
      .eq('date', today)
      .order('created_at')

    setTasks(taskData || [])
    setLoading(false)
  }, [router, today])

  useEffect(() => { loadData() }, [loadData])

  const toggleTask = async (task: Task) => {
    const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
    const supabase = createClient()
    await supabase.from('daily_tasks').update({ status: next }).eq('id', task.id)
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next as Task['status'] } : t))
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      todo: { label: 'Todo', bg: '#f3f4f6', color: '#374151' },
      in_progress: { label: 'In Progress', bg: '#fef3c7', color: '#92400e' },
      done: { label: 'Done', bg: '#d1fae5', color: '#065f46' },
    }
    const s = map[status] || map.todo
    return (
      <span style={{ backgroundColor: s.bg, color: s.color, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
        {s.label}
      </span>
    )
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Loading your tasks...</div>
  }

  const pending = tasks.filter((t) => t.status !== 'done').length
  const done = tasks.filter((t) => t.status === 'done').length

  return (
    <div style={{ padding: 16, backgroundColor: '#f9fafb', minHeight: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#15803d', margin: 0 }}>
          Good day, {workerName.split(' ')[0]}! 👋
        </h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{todayDisplay}</p>
        <p style={{ color: '#374151', fontSize: 13, marginTop: 2 }}>
          {done}/{tasks.length} tasks done today
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ backgroundColor: '#e5e7eb', borderRadius: 999, height: 8, marginBottom: 20 }}>
        <div style={{
          backgroundColor: '#15803d',
          height: 8,
          borderRadius: 999,
          width: tasks.length > 0 ? `${Math.round((done / tasks.length) * 100)}%` : '0%',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p>No tasks assigned for today.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${task.status === 'done' ? '#a7f3d0' : '#e5e7eb'}`,
                borderRadius: 8,
                padding: 14,
                opacity: task.status === 'done' ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#111827',
                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                  flex: 1,
                }}>
                  {task.title}
                </div>
                {statusBadge(task.status)}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                🏡 {(task.farm_locations as { name: string } | undefined)?.name || '—'} · 📅 {task.date}
              </div>
              {task.notes && (
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontStyle: 'italic' }}>
                  {task.notes}
                </div>
              )}
              {task.status !== 'done' ? (
                <button
                  onClick={() => toggleTask(task)}
                  style={{
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    width: '100%',
                  }}
                >
                  {task.status === 'todo' ? 'Start Task →' : 'Mark Done ✓'}
                </button>
              ) : (
                <button
                  onClick={() => toggleTask(task)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 13,
                    width: '100%',
                  }}
                >
                  Completed ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
