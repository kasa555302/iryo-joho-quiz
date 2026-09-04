import { useState } from 'react'
import type { AnswerState, QuizCardProps } from '../types/database'
import { CardShell } from './CardShell'
import { Character } from './Character'

// ○×問題（answer: 1=正しい / 2=誤り）
export function TrueFalseCard({
  question,
  questionIndex,
  totalCount,
  streak = 0,
  onAnswer,
  onNext,
}: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState] = useState<AnswerState>('unanswered')

  const handleSelect = (value: number) => {
    if (state !== 'unanswered') return

    const isCorrect = value === question.answer
    setSelected(value)
    setState(isCorrect ? 'correct' : 'incorrect')
    onAnswer(value, isCorrect)
  }

  const styleFor = (value: number): string => {
    const base = 'tf-btn'
    if (state === 'unanswered') return base
    if (value === question.answer) return `${base} correct`
    if (value === selected) return `${base} incorrect`
    return base
  }

  return (
    <CardShell
      questionIndex={questionIndex}
      totalCount={totalCount}
      category={question.category}
    >
      <span className="type-badge">○× 問題</span>
      <h2 className="question-text">{question.question}</h2>

      <div className="tf-buttons">
        <button
          className={styleFor(1)}
          onClick={() => handleSelect(1)}
          disabled={state !== 'unanswered'}
        >
          ○ 正しい
        </button>
        <button
          className={styleFor(2)}
          onClick={() => handleSelect(2)}
          disabled={state !== 'unanswered'}
        >
          ✕ 誤り
        </button>
      </div>

      {state !== 'unanswered' && (
        <div className={`result-box ${state}`}>
          <p className="result-label">{state === 'correct' ? '✓ 正解！' : 'もう一歩！'}</p>
          <Character
            mood={state === 'incorrect' ? 'incorrect' : streak >= 3 ? 'streak' : 'correct'}
          />
          <p className="explanation">{question.explanation}</p>
          <button className="next-btn" onClick={onNext}>
            次の問題へ →
          </button>
        </div>
      )}
    </CardShell>
  )
}
