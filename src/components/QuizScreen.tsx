import { useState } from 'react'
import { QuizCard } from './QuizCard'
import { useQuestions, useWeakQuestions, useRecordAnswer } from '../hooks/useQuiz'
import type { Category } from '../types/database'

// クイズのモード
type QuizMode = 'all' | 'category' | 'weak'

interface Props {
  userId: string
  onFinish: () => void  // クイズ終了時にコールバック
}

const CATEGORIES: Category[] = ['医学・医療系', '情報処理技術系', '医療情報システム系']

export function QuizScreen({ userId, onFinish }: Props) {
  const [mode, setMode] = useState<QuizMode | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)

  const { recordAnswer } = useRecordAnswer()

  // モードに応じた問題取得
  const allQuery = useQuestions(selectedCategory)
  const weakQuery = useWeakQuestions(userId)

  const { questions, loading, error } =
    mode === 'weak' ? weakQuery : allQuery

  // ---------- モード選択画面 ----------
  if (mode === null) {
    return (
      <div className="mode-select">
        <h2>クイズモードを選択</h2>

        {/* カテゴリ選択 */}
        <section>
          <h3>カテゴリ別</h3>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className="mode-btn"
              onClick={() => {
                setSelectedCategory(cat)
                setMode('category')
                setCurrentIndex(0)
                setCorrectCount(0)
              }}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* 全問題 */}
        <section>
          <h3>全問題</h3>
          <button
            className="mode-btn primary"
            onClick={() => {
              setSelectedCategory(undefined)
              setMode('all')
              setCurrentIndex(0)
              setCorrectCount(0)
            }}
          >
            全カテゴリから出題
          </button>
        </section>

        {/* 苦手問題 */}
        <section>
          <h3>苦手問題モード</h3>
          <button
            className="mode-btn warning"
            onClick={() => {
              setMode('weak')
              setCurrentIndex(0)
              setCorrectCount(0)
            }}
          >
            不正解の問題だけ出題
          </button>
        </section>
      </div>
    )
  }

  // ---------- ローディング ----------
  if (loading) {
    return <p className="loading">問題を読み込み中...</p>
  }

  // ---------- エラー ----------
  if (error) {
    return <p className="error-msg">エラーが発生しました: {error}</p>
  }

  // ---------- 問題が0件 ----------
  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <p>
          {mode === 'weak'
            ? '不正解の問題がありません。まず全問題に挑戦してください。'
            : '問題が見つかりませんでした。'}
        </p>
        <button className="mode-btn" onClick={() => setMode(null)}>
          戻る
        </button>
      </div>
    )
  }

  // ---------- 全問終了 ----------
  if (currentIndex >= questions.length) {
    return (
      <div className="quiz-finish">
        <h2>クイズ終了！</h2>
        <p className="score">
          {questions.length} 問中 <strong>{correctCount} 問</strong> 正解
          （正解率: {Math.round((correctCount / questions.length) * 100)}%）
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
          <button
            className="mode-btn"
            onClick={() => {
              setMode(null)
              onFinish()
            }}
          >
            メニューに戻る
          </button>
        </div>
      </div>
    )
  }

  // ---------- クイズ画面 ----------
  const currentQuestion = questions[currentIndex]

  const handleAnswer = async (_selectedChoice: number, isCorrect: boolean) => {
    // 回答を Supabase に記録
    await recordAnswer(userId, currentQuestion.id, isCorrect)
    if (isCorrect) setCorrectCount((c) => c + 1)
  }

  const handleNext = () => {
    setCurrentIndex((i) => i + 1)
  }

  return (
    <QuizCard
      question={currentQuestion}
      questionIndex={currentIndex}
      totalCount={questions.length}
      onAnswer={handleAnswer}
      onNext={handleNext}
    />
  )
}
