import { useState } from 'react'
import type { Question, AnswerState } from '../types/database'

interface Props {
  question: Question
  questionIndex: number
  totalCount: number
  onAnswer: (selectedChoice: number, isCorrect: boolean) => void
  onNext: () => void
}

export function QuizCard({ question, questionIndex, totalCount, onAnswer, onNext }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState] = useState<AnswerState>('unanswered')

  const choices = [
    question.choice1,
    question.choice2,
    question.choice3,
    question.choice4,
    question.choice5,
  ]

  // 選択肢をクリックしたとき
  const handleSelect = (choiceIndex: number) => {
    if (state !== 'unanswered') return  // 回答済みは変更不可

    const isCorrect = choiceIndex + 1 === question.answer
    setSelected(choiceIndex)
    setState(isCorrect ? 'correct' : 'incorrect')
    onAnswer(choiceIndex + 1, isCorrect)
  }

  // 選択肢ボタンのスタイルを決定する
  const getChoiceStyle = (index: number): string => {
    const base = 'choice-btn'
    if (state === 'unanswered') return base

    // 正解の選択肢は常に緑
    if (index + 1 === question.answer) return `${base} correct`
    // 自分が選んだ不正解は赤
    if (index === selected) return `${base} incorrect`
    return base
  }

  return (
    <div className="quiz-card">
      {/* 進捗表示 */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((questionIndex + 1) / totalCount) * 100}%` }}
        />
      </div>
      <p className="progress-text">
        {questionIndex + 1} / {totalCount} 問
      </p>

      {/* カテゴリバッジ */}
      <span className="category-badge">{question.category}</span>

      {/* 問題文 */}
      <h2 className="question-text">{question.question}</h2>

      {/* 選択肢 */}
      <ol className="choice-list">
        {choices.map((choice, index) => (
          <li key={index}>
            <button
              className={getChoiceStyle(index)}
              onClick={() => handleSelect(index)}
              disabled={state !== 'unanswered'}
            >
              <span className="choice-num">{index + 1}</span>
              {choice}
            </button>
          </li>
        ))}
      </ol>

      {/* 回答後に解説を表示 */}
      {state !== 'unanswered' && (
        <div className={`result-box ${state}`}>
          <p className="result-label">{state === 'correct' ? '✓ 正解！' : '✗ 不正解'}</p>
          <p className="explanation">{question.explanation}</p>
          <button className="next-btn" onClick={onNext}>
            次の問題へ →
          </button>
        </div>
      )}
    </div>
  )
}
