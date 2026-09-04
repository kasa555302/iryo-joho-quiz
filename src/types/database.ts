// Supabase テーブルの型定義

export type Category = '医学・医療系' | '情報処理技術系' | '医療情報システム系'

export type QuestionType = '5択' | '○×' | '用語カード'

export interface Question {
  id: string
  type: QuestionType
  question: string             // 5択/○×は問題文、用語カードは用語（表）
  choice1: string | null
  choice2: string | null
  choice3: string | null
  choice4: string | null
  choice5: string | null
  answer: number | null        // 5択は1〜5、○×は1(正しい)/2(誤り)、用語カードはnull
  category: Category
  explanation: string          // 解説。用語カードでは意味（裏）
  explanation_easy: string | null // 超初心者向けのやさしい説明（任意）
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  question_id: string
  is_correct: boolean          // 最後の回答が正解だったか
  answered_at: string          // 最後に回答した日時
  streak: number               // 現在の連続正解数
  mastered: boolean            // 克服フラグ（連続3回正解）
  next_review_at: string | null // 次に出題してよい日時（null=未スケジュール）
  total_answers: number        // この問題への累計回答数
  correct_answers: number      // この問題への累計正解数
}

// 全回答の追記ログ
export interface AnswerLog {
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
        Insert: Omit<Question, 'id' | 'created_at' | 'type'> & { type?: QuestionType }
        Update: Partial<Omit<Question, 'id' | 'created_at'>>
        Relationships: []
      }
      user_progress: {
        Row: UserProgress
        // DEFAULT を持つカラムは省略可能
        Insert: Pick<UserProgress, 'user_id' | 'question_id' | 'is_correct'> &
          Partial<Omit<UserProgress, 'id' | 'user_id' | 'question_id' | 'is_correct'>>
        Update: Partial<Omit<UserProgress, 'id' | 'user_id' | 'question_id'>>
        Relationships: [
          {
            foreignKeyName: 'user_progress_question_id_fkey'
            columns: ['question_id']
            referencedRelation: 'questions'
            referencedColumns: ['id']
          }
        ]
      }
      answer_logs: {
        Row: AnswerLog
        Insert: Pick<AnswerLog, 'user_id' | 'question_id' | 'is_correct'> & {
          answered_at?: string
        }
        Update: Partial<Pick<AnswerLog, 'is_correct' | 'answered_at'>>
        Relationships: []
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

// カテゴリ別の成長度（🌱 表示用）
export interface CategoryProgress {
  category: Category
  totalQuestions: number   // そのカテゴリの全問題数
  mastered: number         // 克服済み問題数
  reviewing: number        // 苦手（未克服で回答済み）問題数
}

// ホーム画面用のまとめデータ
export interface HomeData {
  todayCount: number                     // 今日解いた問題数
  todayCorrect: number                   // 今日の正解数
  dueByCategory: Record<string, number>  // カテゴリ別・復習待ち問題数
  recommended: { category: Category; count: number } | null
  progress: CategoryProgress[]
}

// 各問題形式のカードで共通の Props
export interface QuizCardProps {
  question: Question
  questionIndex: number
  totalCount: number
  streak?: number
  onAnswer: (selectedChoice: number, isCorrect: boolean) => void
  onNext: () => void
}

// クイズの開始設定（ホームからの導線用）
export interface QuizStart {
  mode: 'all' | 'category' | 'review'
  category?: Category
  limit?: number
}
