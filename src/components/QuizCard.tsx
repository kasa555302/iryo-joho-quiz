import { useState } from 'react'
import type { AnswerState, QuizCardProps } from '../types/database'
import { CardShell } from './CardShell'
import { Character } from './Character'
import { ExplanationBlock } from './ExplanationBlock'

// 5択問題
export function QuizCard({
  question,
  questionIndex,
  totalCount,
  streak = 0,
  onAnswer,
  onNext,
}: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState] = useState<AnswerState>('unanswered')

  const choices = [
    question.choice1,
    question.choice2,
    question.choice3,
    question.choice4,
    question.choice5,
  ]

  const handleSelect = (choiceIndex: number) => {
    if (state !== 'unanswered') return

    const isCorrect = choiceIndex + 1 === question.answer
    setSelected(choiceIndex)
    setState(isCorrect ? 'correct' : 'incorrect')
    onAnswer(choiceIndex + 1, isCorrect)
  }

  const getChoiceStyle = (index: number): string => {
    const base = 'choice-btn'
    if (state === 'unanswered') return base
    if (index + 1 === question.answer) return `${base} correct`
    if (index === selected) return `${base} incorrect`
    return base
  }

  return (
    <CardShell
      questionIndex={questionIndex}
      totalCount={totalCount}
      category={question.category}
    >
      <h2 className="question-text">{question.question}</h2>

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

      {state !== 'unanswered' && (
        <div className={`result-box ${state}`}>
          <p className="result-label">{state === 'correct' ? '✓ 正解！' : 'もう一歩！'}</p>
          <Character
            mood={state === 'incorrect' ? 'incorrect' : streak >= 3 ? 'streak' : 'correct'}
          />
          <ExplanationBlock easy={question.explanation_easy} full={question.explanation} />
          <button className="next-btn" onClick={onNext}>
            次の問題へ →
          </button>
        </div>
      )}
    </CardShell>
  )
}
