// Supabase テーブルの型定義

export type Category = '医学・医療系' | '情報処理技術系' | '医療情報システム系'

export interface Question {
  id: string
  question: string
  choice1: string
  choice2: string
  choice3: string
  choice4: string
  choice5: string
  answer: number          // 1〜5
  category: Category
  explanation: string
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  question_id: string
  is_correct: boolean
  answered_at: string
}

// Supabase クライアントへ渡す Database 型
export interface Database {
  public: {
    Tables: {
      questions: {
        Row: Question
        Insert: Omit<Question, 'id' | 'created_at'>
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
        Relationships: []
      }
      user_progress: {
        Row: UserProgress
        // answered_at はデフォルト値があるため省略可能
        Insert: Omit<UserProgress, 'id'> & { answered_at?: string }
        Update: Partial<Pick<UserProgress, 'is_correct' | 'answered_at'>>
        Relationships: [
          {
            foreignKeyName: 'user_progress_question_id_fkey'
            columns: ['question_id']
            referencedRelation: 'questions'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// カテゴリ別の正解率集計
export interface CategoryStat {
  category: Category
  total: number
  correct: number
  rate: number  // 0〜100（%）
}

// クイズ画面で使う回答状態
export type AnswerState = 'unanswered' | 'correct' | 'incorrect'
