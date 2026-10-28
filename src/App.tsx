import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthForm } from './AuthForm'
import { supabase } from './lib/supabase'

type Todo = {
  id: string
  title: string
  is_completed: boolean
  created_at: string
}

function fetchTasks() {
  return supabase
    .from('todo_tasks')
    .select('id, title, is_completed, created_at')
    .order('created_at', { ascending: false })
}

function TodoList() {
  const [tasks, setTasks] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadTasks() {
    const { data, error } = await fetchTasks()

    if (error) {
      setErrorMessage(error.message)
    } else {
      setTasks((data ?? []) as Todo[])
    }

    setLoading(false)
  }

  useEffect(() => {
    let active = true

    void fetchTasks().then(({ data, error }) => {
      if (!active) return

      if (error) {
        setErrorMessage(error.message)
      } else {
        setTasks((data ?? []) as Todo[])
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const newTitle = title.trim()
    if (!newTitle) return

    setSaving(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('todo_tasks')
      .insert({ title: newTitle })

    if (error) {
      setErrorMessage(error.message)
    } else {
      setTitle('')
      await loadTasks()
    }

    setSaving(false)
  }

  async function toggleTask(task: Todo) {
    setErrorMessage('')

    const { error } = await supabase
      .from('todo_tasks')
      .update({
        is_completed: !task.is_completed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, is_completed: !item.is_completed }
          : item,
      ),
    )
  }

  async function deleteTask(id: string) {
    setErrorMessage('')

    const { error } = await supabase
      .from('todo_tasks')
      .delete()
      .eq('id', id)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setTasks((current) => current.filter((task) => task.id !== id))
  }

  return (
    <section>
      <h1>ToDo</h1>

      <form onSubmit={addTask}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="タスクを入力"
          aria-label="タスク"
          required
        />
        <button type="submit" disabled={saving}>
          {saving ? '追加中…' : '追加'}
        </button>
      </form>

      {errorMessage && <p role="alert">{errorMessage}</p>}
      {loading ? (
        <p>読み込み中…</p>
      ) : tasks.length === 0 ? (
        <p>タスクはまだありません。</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <label>
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={() => void toggleTask(task)}
                />
                <span>{task.title}</span>
              </label>
              <button type="button" onClick={() => void deleteTask(task.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession)
        setCheckingSession(false)
      }
    })

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session)
        setCheckingSession(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (checkingSession) return <p>確認中…</p>
  if (!session) return <AuthForm />

  return (
    <main>
      <p>ログイン中: {session.user.email}</p>
      <button type="button" onClick={() => void supabase.auth.signOut()}>
        ログアウト
      </button>
      <TodoList key={session.user.id} />
    </main>
  )
}