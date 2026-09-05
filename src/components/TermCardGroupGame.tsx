import { useState } from 'react'
import { useTermCardGroups, isExactMatch } from '../hooks/useTermCardGroups'
import { Character } from './Character'

interface Props {
  onBack: () => void
}

// 用語カード「関連グループ探しゲーム」
export function TermCardGroupGame({ onBack }: Props) {
  const { round, loading, error, nextRound } = useTermCardGroups()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [judged, setJudged] = useState<'correct' | 'incorrect' | null>(null)

  const toggleSelect = (id: string) => {
    if (judged) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFlip = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const decide = () => {
    if (!round) return
    setJudged(isExactMatch(selected, round.correctIds) ? 'correct' : 'incorrect')
  }

  const goNext = () => {
    setSelected(new Set())
    setFlipped(new Set())
    setJudged(null)
    nextRound()
  }

  if (loading) return <p className="loading">問題を読み込み中...</p>
  if (error) return <p className="error-msg">エラーが発生しました: {error}</p>
  if (!round) return null

  return (
    <div className="group-game">
      <div className="group-game-header">
        <h2>🃏 用語カード グループ探しゲーム</h2>
        <button className="mode-btn" onClick={onBack}>
          モード選択に戻る
        </button>
      </div>
      <p className="dash-lead">
        関連する用語カードを見つけてタップで選び、「これで決定」を押そう。カードをめくると意味も見られるよ。
      </p>

      <div className="group-game-grid">
        {round.cards.map((card) => {
          const isSelected = selected.has(card.id)
          const isFlipped = flipped.has(card.id)
          const isCorrectMember = round.correctIds.includes(card.id)
          const showAsCorrect = judged !== null && isCorrectMember
          const showAsWrongPick = judged === 'incorrect' && isSelected && !isCorrectMember

          return (
            <div
              key={card.id}
              className={[
                'group-card',
                isSelected ? 'selected' : '',
                showAsCorrect ? 'reveal-correct' : '',
                showAsWrongPick ? 'reveal-wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="group-card-select"
                onClick={() => toggleSelect(card.id)}
                disabled={judged !== null}
                aria-pressed={isSelected}
              >
                {isSelected ? '✓ 選択中' : '選ぶ'}
              </button>
              <div
                className="flashcard group-card-body"
                onClick={() => toggleFlip(card.id)}
                role="button"
                tabIndex={0}
              >
                <p className="flashcard-term">{card.question}</p>
                {isFlipped && (
                  <>
                    <p className="flashcard-meaning">{card.explanation}</p>
                    {card.explanation_easy && (
                      <div className="easy-note">
                        <p className="easy-label">やさしく言うと</p>
                        <p className="easy-body">{card.explanation_easy}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {judged === null && (
        <div className="group-game-actions">
          <button className="mode-btn primary" onClick={decide} disabled={selected.size === 0}>
            これで決定（{selected.size}枚選択中）
          </button>
        </div>
      )}

      {judged !== null && (
        <div className={`result-box ${judged}`}>
          <Character
            mood={judged === 'correct' ? 'streak' : 'incorrect'}
            message={
              judged === 'correct'
                ? `正解！「${round.groupName}」のグループを見つけたね！`
                : `おしい！正解は「${round.groupName}」のグループ（緑色のカード）だったよ`
            }
          />
          <div className="group-game-actions">
            <button className="mode-btn primary" onClick={goNext}>
              次のグループへ →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
