import { useMemo, useState } from 'react'
import { QuizCard } from './QuizCard'
import { useQuestions, useReviewQuestions, useRecordAnswer } from '../hooks/useQuiz'
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
  }

  const backToMenu = () => {
    if (start) {
      // ホームから来た場合はホームへ戻す
      onFinish()
    } else {
      setActive(null)
      setCurrentIndex(0)
      setCorrectCount(0)
    }
  }

  // ---------- モード選択画面 ----------
  if (active === null) {
    return (
      <div className="mode-select">
        <h2>クイズモードを選択</h2>

        <section>
          <h3>カテゴリ別</h3>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="mode-btn"
              onClick={() => begin({ mode: 'category', category: cat })}
            >
              {cat}
            </button>
          ))}
        </section>

        <section>
          <h3>全問題</h3>
          <button className="mode-btn primary" onClick={() => begin({ mode: 'all' })}>
            全カテゴリから出題
          </button>
        </section>

        <section>
          <h3>苦手復習モード</h3>
          <button className="mode-btn warning" onClick={() => begin({ mode: 'review' })}>
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
    await recordAnswer(userId, currentQuestion.id, isCorrect)
    if (isCorrect) setCorrectCount((c) => c + 1)
  }

  const handleNext = () => {
    setCurrentIndex((i) => i + 1)
  }

  return (
    <QuizCard
      key={currentQuestion.id}
      question={currentQuestion}
      questionIndex={currentIndex}
      totalCount={pool.length}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  )
}
