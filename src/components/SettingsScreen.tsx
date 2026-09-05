import { useState } from 'react'
import { usePassedCategories } from '../hooks/usePassedCategories'
import type { Category } from '../types/database'

interface Props {
  userId: string
}

const CATEGORIES: Category[] = ['医学・医療系', '情報処理技術系', '医療情報システム系']

export function SettingsScreen({ userId }: Props) {
  const { passed, loading, error, setCategoryPassed } = usePassedCategories(userId)
  const [savingCategory, setSavingCategory] = useState<Category | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const toggle = async (category: Category, nextValue: boolean) => {
    setSavingCategory(category)
    setSaveError(null)
    const err = await setCategoryPassed(category, nextValue)
    if (err) setSaveError(err)
    setSavingCategory(null)
  }

  if (loading) return <p className="loading">読み込み中...</p>

  return (
    <div className="settings-screen">
      <h2>⚙️ 設定</h2>

      <section className="dash-card">
        <h3>合格済み科目の除外</h3>
        <p className="dash-lead">
          すでに合格した科目はクイズに出さないようにできます（次回受験の免除制度に対応）。
          「全問題」「カテゴリ別」「苦手復習」「おすすめ」から対象外になります。
        </p>

        {error && <p className="error-msg">読み込みエラー: {error}</p>}
        {saveError && <p className="error-msg">{saveError}</p>}

        <ul className="settings-toggle-list">
          {CATEGORIES.map((category) => {
            const isPassed = passed.has(category)
            const isSaving = savingCategory === category
            return (
              <li key={category} className="settings-toggle-row">
                <span className="settings-toggle-label">{category}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPassed}
                  className={`toggle-switch ${isPassed ? 'on' : ''}`}
                  disabled={isSaving}
                  onClick={() => toggle(category, !isPassed)}
                >
                  <span className="toggle-knob" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
