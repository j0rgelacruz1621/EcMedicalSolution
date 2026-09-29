import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import LeftSideBar from '../../left-sideBar'
import Header from '../../header'
import './style.scss'
import {
  getDoctorTasks,
  createDoctorTask,
  updateTaskStatus,
  deleteTask,
  type Task,
  type TaskStatus,
} from '../../../services/tasks/task-services'

const STATUS_FILTERS: { value: TaskStatus | 'ALL'; label: string }[] = [
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'ALL', label: 'Todas' },
]

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
}

export default function PendingTasksView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = localStorage.getItem('user_rol')
  const doctorId = Number(
    role === 'DOCTOR'
      ? localStorage.getItem('doctor_id')
      : searchParams.get('doctorId') || sessionStorage.getItem('active_doctor_id') || 0,
  )
  const contextQuery = doctorId ? `?doctorId=${doctorId}` : ''

  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!doctorId) return
    setLoading(true)
    getDoctorTasks(doctorId, { limit: 50 })
      .then(result => setTasks(result.data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [doctorId])

  const handleCreate = async () => {
    const title = newTitle.trim()
    if (!title || !doctorId) return
    setSaving(true)
    try {
      const created = await createDoctorTask(doctorId, { title, priority: newPriority })
      setTasks(prev => [created, ...prev])
      setNewTitle('')
    } catch {
      /* noop */
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED'
    setTasks(prev => prev.map(item => item.id === task.id ? { ...item, status: nextStatus } : item))
    try {
      await updateTaskStatus(task.id, nextStatus)
    } catch {
      setTasks(prev => prev.map(item => item.id === task.id ? { ...item, status: task.status } : item))
    }
  }

  const handleDelete = async (task: Task) => {
    const previous = tasks
    setTasks(prev => prev.filter(item => item.id !== task.id))
    try {
      await deleteTask(task.id)
    } catch {
      setTasks(previous)
    }
  }

  const visible = tasks.filter(task => filter === 'ALL' || (task.status || 'PENDING') === filter)

  return (
    <div className="pt-root">
      <LeftSideBar />
      <main className="pt-main">
        <Header />
        <div className="pt-header">
          <h1>Tareas pendientes</h1>
        </div>

        <div className="pt-toolbar">
          {STATUS_FILTERS.map(item => (
            <button
              key={item.value}
              type="button"
              className={`pt-filter${filter === item.value ? ' active' : ''}`}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="pt-create">
          <input
            placeholder="Describe la nueva tarea..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          />
          <select value={newPriority} onChange={e => setNewPriority(e.target.value as typeof newPriority)}>
            <option value="MEDIUM">Prioridad media</option>
            <option value="HIGH">Prioridad alta</option>
            <option value="LOW">Prioridad baja</option>
          </select>
          <button type="button" onClick={handleCreate} disabled={saving || !newTitle.trim()}>
            <Plus size={18} /> Agregar
          </button>
        </div>

        <div className="pt-list">
          {loading && <p className="pt-empty">Cargando tareas...</p>}
          {!loading && visible.length === 0 && (
            <p className="pt-empty">No hay tareas en esta categoría.</p>
          )}
          {visible.map(task => (
            <div
              key={task.id}
              className={`pt-task ${task.priority === 'HIGH' ? 'pt-task--danger' : task.priority === 'LOW' ? 'pt-task--success' : 'pt-task--primary'}${task.status === 'COMPLETED' ? ' done' : ''}`}
            >
              <input
                type="checkbox"
                checked={task.status === 'COMPLETED'}
                onChange={() => handleToggle(task)}
                aria-label={`Completar ${task.title}`}
              />
              <div className="pt-task-copy">
                <p>{task.title}</p>
                {task.description && <small>{task.description}</small>}
              </div>
              {task.priority && (
                <span className="pt-priority">{PRIORITY_LABEL[task.priority] || task.priority}</span>
              )}
              <button type="button" className="pt-delete" onClick={() => handleDelete(task)} aria-label="Eliminar tarea">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="pt-back" onClick={() => navigate(`/control-panel${contextQuery}`)}>
          <ArrowLeft size={16} /> Volver al panel
        </button>
      </main>
    </div>
  )
}
