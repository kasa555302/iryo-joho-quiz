import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { QuizScreen } from './components/QuizScreen'
import { CategoryStats } from './components/CategoryStats'
import './App.css'
import type { User } from '@supabase/supabase-js'

// アプリ内の画面
type Screen = 'home' | 'quiz' | 'stats'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [authLoading, setAuthLoading] = useState(true)

  // 認証状態を監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // メールアドレス・パスワードでサインイン
  const handleSignIn = async () => {
    const email = window.prompt('メールアドレスを入力してください')
    const password = window.prompt('パスワードを入力してください')
    if (!email || !password) return

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert('サインインに失敗しました: ' + error.message)
  }

  // 新規サインアップ
  const handleSignUp = async () => {
    const email = window.prompt('メールアドレスを入力してください')
    const password = window.prompt('パスワードを入力してください（6文字以上）')
    if (!email || !password) return

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert('サインアップに失敗しました: ' + error.message)
    } else {
      // メール確認不要の設定のため、signUp成功時点でセッションが発行される
      if (data.session) {
        setUser(data.session.user)
      }
      alert('登録しました！')
    }
  }

  // サインアウト
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setScreen('home')
  }

  if (authLoading) {
    return <div className="app-loading"><p>読み込み中...</p></div>
  }

  return (
    <div className="app">
      {/* ヘッダー */}
      <header className="app-header">
        <h1>医療情報技師 学習クイズ</h1>
        <nav className="header-nav">
          {user ? (
            <>
              <button className="nav-btn" onClick={() => setScreen('home')}>ホーム</button>
              <button className="nav-btn" onClick={() => setScreen('quiz')}>クイズ</button>
              <button className="nav-btn" onClick={() => setScreen('stats')}>成績</button>
              <button className="nav-btn sign-out" onClick={handleSignOut}>ログアウト</button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={handleSignIn}>ログイン</button>
              <button className="nav-btn primary" onClick={handleSignUp}>新規登録</button>
            </>
          )}
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="app-main">
        {/* 未ログイン */}
        {!user && (
          <div className="welcome">
            <h2>医療情報技師試験の合格を目指そう</h2>
            <p>ログインまたは新規登録して学習を開始してください。</p>
            <div className="welcome-actions">
              <button className="mode-btn primary" onClick={handleSignIn}>ログイン</button>
              <button className="mode-btn" onClick={handleSignUp}>新規登録</button>
            </div>
          </div>
        )}

        {/* ホーム画面 */}
        {user && screen === 'home' && (
          <div className="home">
            <p className="user-info">ログイン中: {user.email}</p>
            <div className="home-actions">
              <button className="mode-btn primary" onClick={() => setScreen('quiz')}>
                クイズを始める
              </button>
              <button className="mode-btn" onClick={() => setScreen('stats')}>
                成績を確認する
              </button>
            </div>
          </div>
        )}

        {/* クイズ画面 */}
        {user && screen === 'quiz' && (
          <QuizScreen
            userId={user.id}
            onFinish={() => setScreen('stats')}
          />
        )}

        {/* 成績画面 */}
        {user && screen === 'stats' && (
          <CategoryStats userId={user.id} />
        )}
      </main>
    </div>
  )
}

export default App
