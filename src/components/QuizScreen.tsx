import { useMemo, useState } from 'react'
import { QuizCard } from './QuizCard'
import { TrueFalseCard } from './TrueFalseCard'
import { FlashCard } from './FlashCard'
import { useQuestions, useReviewQuestions, useRecordAnswer } from '../hooks/useQuiz'
import { Character } from './Character'
import type { Category, QuizStart } from '../types/database'

interface Props {
  userId: string
  onFinish: () => void // クイズ終了・メニューに戻るときのコールバック
  start?: QuizStart // ホームからの導線で開始設定が渡された場合
}

const CATEGORIES: Category[] = ['医学・医療系', '情報処理技術系', '医療情報システム系']

export function QuizScreen({ userId, onFinish, start }: Props) {
  // start が渡されていればモード選択を飛ばして即開始
  const [active, setActive] = useState<QuizStart | null>(start ?? null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  // モード選択画面での出題数（スキマ学習用。undefined = 全部）
  const [limit, setLimit] = useState<number | undefined>(5)

  const { recordAnswer } = useRecordAnswer()

  const category = active?.mode === 'category' || active?.mode === 'review' ? active.category : undefined
  const allQuery = useQuestions(active?.mode === 'category' ? category : undefined)
  const reviewQuery = useReviewQuestions(userId, active?.mode === 'review' ? category : undefined)

  const { questions, loading, error } =
    active?.mode === 'review' ? reviewQuery : allQuery

  // 出題数の上限（「3問だけ」などスキマ学習用）
  const pool = useMemo(
    () => (active?.limit ? questions.slice(0, active.limit) : questions),
    [questions, active]
  )

  const begin = (next: QuizStart) => {
    setActive(next)
    setCurrentIndex(0)
    setCorrectCount(0)
    setStreak(0)
  }

  const backToMenu = () => {
    if (start) {
      // ホームから来た場合はホームへ戻す
      onFinish()
    } else {
      setActive(null)
      setCurrentIndex(0)
      setCorrectCount(0)
      setStreak(0)
    }
  }

  // ---------- モード選択画面 ----------
  if (active === null) {
    return (
      <div className="mode-select">
        <h2>クイズモードを選択</h2>

        <section>
          <h3>出題数（スキマ時間に）</h3>
          <div className="limit-picker">
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                className={`chip ${limit === n ? 'selected' : ''}`}
                onClick={() => setLimit(n)}
              >
                {n}問
              </button>
            ))}
            <button
              className={`chip ${limit === undefined ? 'selected' : ''}`}
              onClick={() => setLimit(undefined)}
            >
              全部
            </button>
          </div>
        </section>

        <section>
          <h3>カテゴリ別</h3>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="mode-btn"
              onClick={() => begin({ mode: 'category', category: cat, limit })}
            >
              {cat}
            </button>
          ))}
        </section>

        <section>
          <h3>全問題</h3>
          <button className="mode-btn primary" onClick={() => begin({ mode: 'all', limit })}>
            全カテゴリから出題
          </button>
        </section>

        <section>
          <h3>苦手復習モード</h3>
          <button className="mode-btn warning" onClick={() => begin({ mode: 'review', limit })}>
            復習が必要な問題を出題
          </button>
        </section>
      </div>
    )
  }

  if (loading) {
    return <p className="loading">問題を読み込み中...</p>
  }

  if (error) {
    return <p className="error-msg">エラーが発生しました: {error}</p>
  }

  if (pool.length === 0) {
    return (
      <div className="empty-state">
        <p>
          {active.mode === 'review'
            ? '今日復習する問題はありません。よくできています！'
            : '問題が見つかりませんでした。'}
        </p>
        {active.mode === 'review' && <Character mood="finish" message="苦手、しっかり克服できてるよ！" />}
        <button className="mode-btn" onClick={backToMenu}>
          戻る
        </button>
      </div>
    )
  }

  // ---------- 全問終了 ----------
  if (currentIndex >= pool.length) {
    return (
      <div className="quiz-finish">
        <h2>今日も一歩前進！</h2>
        <Character
          mood="finish"
          message={
            correctCount === pool.length
              ? '全問正解！すごい！'
              : correctCount === 0
                ? 'おつかれさま。ここが伸びしろだよ'
                : `${pool.length} 問中 ${correctCount} 問正解！よくがんばったね`
          }
        />
        <p className="score">
          {pool.length} 問中 <strong>{correctCount} 問</strong> 正解
          （正解率: {Math.round((correctCount / pool.length) * 100)}%）
        </p>
        <div className="finish-actions">
          <button
            className="mode-btn primary"
            onClick={() => {
              setCurrentIndex(0)
              setCorrectCount(0)
              setStreak(0)
            }}
          >
            もう一度
          </button>
          <button className="mode-btn" onClick={backToMenu}>
            {start ? 'ホームに戻る' : 'メニューに戻る'}
          </button>
        </div>
      </div>
    )
  }

  // ---------- クイズ画面 ----------
  const currentQuestion = pool[currentIndex]

  const handleAnswer = async (_selectedChoice: number, isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      setStreak((s) => s + 1)
    } else {
      setStreak(0)
    }
    await recordAnswer(userId, currentQuestion.id, isCorrect)
  }

  const handleNext = () => {
    setCurrentIndex((i) => i + 1)
  }

  const Card =
    currentQuestion.type === '○×'
      ? TrueFalseCard
      : currentQuestion.type === '用語カード'
        ? FlashCard
        : QuizCard

  return (
    <Card
      key={currentQuestion.id}
      question={currentQuestion}
      questionIndex={currentIndex}
      totalCount={pool.length}
      streak={streak}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  )
}
