import { useState, type FormEvent } from 'react'
import { supabase } from './lib/supabase'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error

        setMessage(
          data.session
            ? '登録しました。'
            : '確認メールを送信しました。メール内のリンクから確認してください。',
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>{isSignUp ? 'アカウント登録' : 'ログイン'}</h1>

      <form onSubmit={handleSubmit}>
        <label>
          メールアドレス
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          パスワード
          <input
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? '処理中…' : isSignUp ? '登録' : 'ログイン'}
        </button>
      </form>

      <p role="status">{message}</p>

      <button type="button" onClick={() => setIsSignUp((value) => !value)}>
        {isSignUp ? 'ログインはこちら' : '新規登録はこちら'}
      </button>
    </main>
  )
}