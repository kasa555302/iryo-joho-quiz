// 学習を応援するマスコット「ぺんくん」。
// ネットワーク・データを連想させるペンギン（IT の定番）で、癒し系。
// 不正解のときも決して責めない。

export type MascotMood = 'idle' | 'correct' | 'streak' | 'incorrect' | 'review' | 'finish'

const FACE: Record<MascotMood, string> = {
  idle: '🐧',
  correct: '🐧',
  streak: '🐧✨',
  incorrect: '🐧',
  review: '🐧',
  finish: '🐧🎉',
}

const DEFAULT_MESSAGE: Record<MascotMood, string> = {
  idle: '今日もこつこつ続けよう！',
  correct: 'ナイス！その調子！',
  streak: 'かなり分かってきたね！',
  incorrect: '大丈夫。ここは苦手になりやすいところだよ',
  review: 'この問題、もう一回一緒にやろう！',
  finish: '今日も一歩前進！',
}

interface Props {
  mood: MascotMood
  message?: string
}

export function Character({ mood, message }: Props) {
  return (
    <div className={`mascot mascot-${mood}`}>
      <span className="mascot-face" aria-hidden="true">
        {FACE[mood]}
      </span>
      <p className="mascot-bubble">{message ?? DEFAULT_MESSAGE[mood]}</p>
    </div>
  )
}
