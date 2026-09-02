import { useHomeData } from '../hooks/useQuiz'
import type { CategoryProgress, QuizStart } from '../types/database'

interface Props {
  userId: string
  email?: string
  onStartQuiz: (start: QuizStart) => void
  onOpenStats: () => void
}

const DAILY_GOAL = 5 // 「今日の学習」の目安問題数

// 成長度を 🌱（克服）と ○（未克服）のドットで表す。最大 10 個に丸める。
function GrowthDots({ p }: { p: CategoryProgress }) {
  const total = p.totalQuestions
  if (total === 0) return <span className="growth-dots">（問題なし）</span>

  const slots = Math.min(total, 10)
  const filled = Math.round((p.mastered / total) * slots)
  return (
    <span className="growth-dots" aria-label={`${p.mastered}/${total} 克服`}>
      {'🌱'.repeat(filled)}
      {'○'.repeat(slots - filled)}
    </span>
  )
}

export function HomeScreen({ userId, email, onStartQuiz, onOpenStats }: Props) {
  const { data, loading, error } = useHomeData(userId)

  if (loading) return <p className="loading">読み込み中...</p>
  if (error) return <p className="error-msg">読み込みエラー: {error}</p>
  if (!data) return null

  const remaining = Math.max(0, DAILY_GOAL - data.todayCount)
  const dueCategories = Object.entries(data.dueByCategory).filter(([, n]) => n > 0)

  return (
    <div className="home-dash">
      {email && <p className="user-info">ログイン中: {email}</p>}

      {/* 今日の学習 */}
      <section className="dash-card">
        <h2>🌱 今日の学習</h2>
        {data.todayCount === 0 ? (
          <p className="dash-lead">今日はまだ問題を解いていません。1問だけでも始めてみませんか？</p>
        ) : (
          <p className="dash-lead">
            今日は <strong>{data.todayCount} 問</strong> クリア！
            {remaining > 0 ? ` — あと ${remaining} 問で目標達成` : ' — 目標達成、おつかれさま！'}
          </p>
        )}
        <div className="dash-actions">
          <button className="mode-btn primary" onClick={() => onStartQuiz({ mode: 'all', limit: 3 })}>
            1分だけ（3問）
          </button>
          <button className="mode-btn" onClick={() => onStartQuiz({ mode: 'all', limit: 5 })}>
            5問やる
          </button>
        </div>
      </section>

      {/* 苦手克服 */}
      {dueCategories.length > 0 && (
        <section className="dash-card">
          <h2>🔥 苦手克服</h2>
          <p className="dash-lead">復習のタイミングが来た問題があります。</p>
          <div className="dash-actions">
            {dueCategories.map(([cat, n]) => (
              <button
                key={cat}
                className="mode-btn warning"
                onClick={() =>
                  onStartQuiz({ mode: 'review', category: cat as QuizStart['category'], limit: n })
                }
              >
                {cat} &nbsp;{n}問
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 今日のおすすめ */}
      {data.recommended && (
        <section className="dash-card">
          <h2>📚 今日のおすすめ</h2>
          <p className="dash-lead">まだ手をつけていない問題から出題します。</p>
          <div className="dash-actions">
            <button
              className="mode-btn"
              onClick={() =>
                onStartQuiz({
                  mode: 'category',
                  category: data.recommended!.category,
                  limit: data.recommended!.count,
                })
              }
            >
              {data.recommended.category} &nbsp;{data.recommended.count}問
            </button>
          </div>
        </section>
      )}

      {/* あなたの成長 */}
      <section className="dash-card">
        <h2>📈 あなたの成長</h2>
        {data.progress.map((p) => (
          <div key={p.category} className="growth-row">
            <span className="growth-cat">{p.category}</span>
            <GrowthDots p={p} />
            <span className="growth-num">
              {p.mastered}/{p.totalQuestions}
            </span>
          </div>
        ))}
        <div className="dash-actions">
          <button className="mode-btn" onClick={onOpenStats}>
            くわしい成績を見る
          </button>
        </div>
      </section>
    </div>
  )
}
