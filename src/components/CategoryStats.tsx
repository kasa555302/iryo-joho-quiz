import { useCategoryStats } from '../hooks/useQuiz'

interface Props {
  userId: string
}

export function CategoryStats({ userId }: Props) {
  const { stats, loading, error } = useCategoryStats(userId)

  if (loading) return <p className="loading">集計中...</p>
  if (error) return <p className="error-msg">集計エラー: {error}</p>

  if (stats.length === 0) {
    return (
      <div className="stats-empty">
        <p>まだ回答履歴がありません。クイズに挑戦してみましょう！</p>
      </div>
    )
  }

  return (
    <div className="stats-container">
      <h2>カテゴリ別正解率</h2>
      {stats.map((s) => (
        <div key={s.category} className="stat-row">
          <div className="stat-header">
            <span className="stat-category">{s.category}</span>
            <span className="stat-rate">{s.rate}%</span>
          </div>
          {/* 正解率バー */}
          <div className="stat-bar-bg">
            <div
              className="stat-bar-fill"
              style={{
                width: `${s.rate}%`,
                // 正解率に応じて色を変える（60%未満は赤、80%未満は黄、80%以上は緑）
                backgroundColor:
                  s.rate >= 80 ? '#22c55e' : s.rate >= 60 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <p className="stat-detail">
            {s.total} 問回答 / {s.correct} 問正解
          </p>
        </div>
      ))}
    </div>
  )
}
