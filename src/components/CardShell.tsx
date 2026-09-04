import type { ReactNode } from 'react'
import type { Category } from '../types/database'

interface Props {
  questionIndex: number
  totalCount: number
  category: Category
  children: ReactNode
}

// 全問題形式で共通の枠（進捗バー・カテゴリバッジ）
export function CardShell({ questionIndex, totalCount, category, children }: Props) {
  return (
    <div className="quiz-card">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((questionIndex + 1) / totalCount) * 100}%` }}
        />
      </div>
      <p className="progress-text">
        {questionIndex + 1} / {totalCount} 問
      </p>

      <span className="category-badge">{category}</span>

      {children}
    </div>
  )
}
