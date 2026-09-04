import { useState } from 'react'
import type { QuizCardProps } from '../types/database'
import { CardShell } from './CardShell'
import { Character } from './Character'

// 用語カード（表：用語 / 裏：意味）。自己採点で「わかった」=正解、「もう一度」=不正解。
export function FlashCard({
  question,
  questionIndex,
  totalCount,
  streak = 0,
  onAnswer,
  onNext,
}: QuizCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [graded, setGraded] = useState<'correct' | 'incorrect' | null>(null)

  const grade = (isCorrect: boolean) => {
    if (graded) return
    setGraded(isCorrect ? 'correct' : 'incorrect')
    onAnswer(0, isCorrect)
  }

  return (
    <CardShell
      questionIndex={questionIndex}
      totalCount={totalCount}
      category={question.category}
    >
      <span className="type-badge">用語カード</span>

      <div className="flashcard">
        <p className="flashcard-term">{question.question}</p>
        {revealed ? (
          <>
            <p className="flashcard-meaning">{question.explanation}</p>
            {question.explanation_easy && (
              <div className="easy-note">
                <p className="easy-label">やさしく言うと</p>
                <p className="easy-body">{question.explanation_easy}</p>
              </div>
            )}
          </>
        ) : (
          <button className="next-btn" onClick={() => setRevealed(true)}>
            答えを見る
          </button>
        )}
      </div>

      {revealed && !graded && (
        <div className="flashcard-grade">
          <p className="flashcard-ask">思い出せましたか？</p>
          <div className="tf-buttons">
            <button className="tf-btn" onClick={() => grade(false)}>
              もう一度
            </button>
            <button className="tf-btn correct" onClick={() => grade(true)}>
              わかった
            </button>
          </div>
        </div>
      )}

      {graded && (
        <div className={`result-box ${graded}`}>
          <Character
            mood={
              graded === 'incorrect' ? 'review' : streak >= 3 ? 'streak' : 'correct'
            }
            message={
              graded === 'incorrect'
                ? 'また出てくるから大丈夫。少しずつ覚えよう'
                : undefined
            }
          />
          <button className="next-btn" onClick={onNext}>
            次の問題へ →
          </button>
        </div>
      )}
    </CardShell>
  )
}
