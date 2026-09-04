import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type {
  Question,
  UserProgress,
  CategoryStat,
  Category,
  CategoryProgress,
  HomeData,
} from '../types/database'

const CATEGORIES: Category[] = ['医学・医療系', '情報処理技術系', '医療情報システム系']
const DAY_MS = 86_400_000
const MASTERED_STREAK = 3 // 連続正解がこの回数に達したら「克服」

// --------------------
// 復習スケジュールの計算
// 間違えたら翌日に再出題。正解を重ねるほど間隔を延ばす（1→3→7→14日）。
// --------------------
export interface ScheduleFields {
  streak: number
  mastered: boolean
  next_review_at: string
  total_answers: number
  correct_answers: number
}

function computeSchedule(
  prev: { streak: number; total_answers: number; correct_answers: number },
  isCorrect: boolean
): ScheduleFields {
  const total_answers = prev.total_answers + 1
  const correct_answers = prev.correct_answers + (isCorrect ? 1 : 0)

  if (!isCorrect) {
    return {
      streak: 0,
      mastered: false,
      next_review_at: new Date(Date.now() + DAY_MS).toISOString(),
      total_answers,
      correct_answers,
    }
  }

  const streak = prev.streak + 1
  const days = streak <= 1 ? 1 : streak === 2 ? 3 : streak === 3 ? 7 : 14
  return {
    streak,
    mastered: streak >= MASTERED_STREAK,
    next_review_at: new Date(Date.now() + days * DAY_MS).toISOString(),
    total_answers,
    correct_answers,
  }
}

// --------------------
// 「復習が必要な問題」の判定（復習モードと全問/カテゴリ別モードで共通利用）
//   未克服 かつ（最後の回答が不正解 または 次回出題日時を過ぎている）
// ※ この関数が唯一の判定箇所。条件を書き分けてズレが生じないようにする。
// --------------------
export function isDueForReview(
  progress: Pick<UserProgress, 'mastered' | 'is_correct' | 'next_review_at'>,
  now: number = Date.now()
): boolean {
  if (progress.mastered) return false
  return (
    !progress.is_correct ||
    (progress.next_review_at != null && Date.parse(progress.next_review_at) <= now)
  )
}

// Fisher-Yates シャッフル（元配列は変更しない）
function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// --------------------
// 「全問題」「カテゴリ別」モードの出題プールを、次の優先順位で並べて返す。
//   ① 未回答（user_progress に行がない）    … 最優先・ランダム順
//   ② 復習が必要（isDueForReview が真）      … 次点・ランダム順
//   ③ それ以外（克服済み・正解済みで期日前） … 残り全部・ランダム順
// ①→②→③ の順に連結して返す。実際の出題数の絞り込み（limit 件の
// 切り出し）は呼び出し側（QuizScreen の pool）が slice(0, limit) で行う。
// 連結済み配列を前から切り出すため、
//   ・① だけで limit を超える → ① からランダムに limit 件
//   ・①+② で超える           → ③ は混ざらない
// が自動的に満たされる。②③ の件数・割合の上限は設けない。
// --------------------
export function usePrioritizedQuestions(userId: string | null, category?: Category) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)

      let questionQuery = supabase.from('questions').select('*')
      if (category) questionQuery = questionQuery.eq('category', category)

      const [questionsRes, progressRes] = await Promise.all([
        questionQuery,
        supabase
          .from('user_progress')
          .select('question_id, mastered, is_correct, next_review_at')
          .eq('user_id', userId),
      ])

      if (questionsRes.error || progressRes.error) {
        setError(
          questionsRes.error?.message ?? progressRes.error?.message ?? '不明なエラー'
        )
        setLoading(false)
        return
      }

      const progressByQid = new Map(
        (progressRes.data ?? []).map((p) => [p.question_id, p])
      )
      const now = Date.now()

      const unanswered: Question[] = []
      const review: Question[] = []
      const rest: Question[] = []

      for (const q of questionsRes.data ?? []) {
        const p = progressByQid.get(q.id)
        if (!p) {
          unanswered.push(q)
        } else if (isDueForReview(p, now)) {
          review.push(q)
        } else {
          rest.push(q)
        }
      }

      // 各段階をシャッフルしてから ①→②→③ の順に連結（この順序は崩さない）
      setQuestions([...shuffle(unanswered), ...shuffle(review), ...shuffle(rest)])
      setLoading(false)
    }

    run()
  }, [userId, category])

  return { questions, loading, error }
}

// --------------------
// 復習が必要な問題を取得（苦手問題優先システムの中核）
//   - next_review_at を過ぎた未克服の問題
//   - まだスケジュールされていないが最後の回答が不正解の問題
// カテゴリで絞り込むこともできる。
// --------------------
export function useReviewQuestions(userId: string | null, category?: Category) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchReview = async () => {
      setLoading(true)
      setError(null)

      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('question_id, mastered, next_review_at, is_correct')
        .eq('user_id', userId)
        .eq('mastered', false)

      if (progressError) {
        setError(progressError.message)
        setLoading(false)
        return
      }

      const now = Date.now()
      // 判定は isDueForReview に一本化（.eq('mastered', false) 済みなので結果は従来と同一）
      const ids = (progress ?? [])
        .filter((p) => isDueForReview(p, now))
        .map((p) => p.question_id)

      if (ids.length === 0) {
        setQuestions([])
        setLoading(false)
        return
      }

      let query = supabase.from('questions').select('*').in('id', ids)
      if (category) query = query.eq('category', category)
      const { data, error } = await query.order('created_at')

      if (error) {
        setError(error.message)
      } else {
        setQuestions(data ?? [])
      }
      setLoading(false)
    }

    fetchReview()
  }, [userId, category])

  return { questions, loading, error }
}

// --------------------
// 回答を記録する
//   1) answer_logs に追記（学習量の集計用）
//   2) user_progress を更新（復習スケジュール・克服判定）
// --------------------
export function useRecordAnswer() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recordAnswer = useCallback(
    async (userId: string, questionId: string, isCorrect: boolean) => {
      setSaving(true)
      setError(null)

      const { error: logError } = await supabase.from('answer_logs').insert({
        user_id: userId,
        question_id: questionId,
        is_correct: isCorrect,
      })
      if (logError) {
        setError(logError.message)
        setSaving(false)
        return
      }

      // 現在のスケジュール状態を読み取ってから次回出題日を計算する
      const { data: prev } = await supabase
        .from('user_progress')
        .select('streak, total_answers, correct_answers')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle()

      const schedule = computeSchedule(
        prev ?? { streak: 0, total_answers: 0, correct_answers: 0 },
        isCorrect
      )

      const { error } = await supabase.from('user_progress').upsert(
        {
          user_id: userId,
          question_id: questionId,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
          ...schedule,
        },
        { onConflict: 'user_id,question_id' }
      )

      if (error) {
        setError(error.message)
      }
      setSaving(false)
    },
    []
  )

  return { recordAnswer, saving, error }
}

// --------------------
// カテゴリ別正解率の集計
// --------------------
export function useCategoryStats(userId: string | null) {
  const [stats, setStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      setError(null)

      // 自分の回答履歴を取得
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('question_id, is_correct')
        .eq('user_id', userId)

      if (progressError) {
        setError(progressError.message)
        setLoading(false)
        return
      }

      if (!progressData || progressData.length === 0) {
        setStats([])
        setLoading(false)
        return
      }

      // 回答済み問題の question_id 一覧を取得
      const questionIds = progressData.map((p) => p.question_id)

      // 問題のカテゴリを取得
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, category')
        .in('id', questionIds)

      if (questionsError) {
        setError(questionsError.message)
        setLoading(false)
        return
      }

      // question_id → category のマップを作成
      const categoryMap: Record<string, string> = {}
      for (const q of questionsData ?? []) {
        categoryMap[q.id] = q.category
      }

      // カテゴリ別に集計
      const aggregated: Record<string, { total: number; correct: number }> = {}

      for (const row of progressData) {
        const cat = categoryMap[row.question_id]
        if (!cat) continue
        if (!aggregated[cat]) aggregated[cat] = { total: 0, correct: 0 }
        aggregated[cat].total++
        if (row.is_correct) aggregated[cat].correct++
      }

      const result: CategoryStat[] = Object.entries(aggregated).map(
        ([category, { total, correct }]) => ({
          category: category as Category,
          total,
          correct,
          rate: total > 0 ? Math.round((correct / total) * 100) : 0,
        })
      )

      setStats(result)
      setLoading(false)
    }

    fetchStats()
  }, [userId])

  return { stats, loading, error }
}

// --------------------
// カテゴリ別の成長度（🌱 表示用）
// そのカテゴリの全問題数のうち、いくつを克服したか。
// --------------------
export function useCategoryProgress(userId: string | null) {
  const [progress, setProgress] = useState<CategoryProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const [questionsRes, progressRes] = await Promise.all([
      supabase.from('questions').select('id, category'),
      supabase
        .from('user_progress')
        .select('question_id, mastered')
        .eq('user_id', userId),
    ])

    if (questionsRes.error || progressRes.error) {
      setError(questionsRes.error?.message ?? progressRes.error?.message ?? '不明なエラー')
      setLoading(false)
      return
    }

    const catOf: Record<string, string> = {}
    const totals: Record<string, number> = {}
    for (const q of questionsRes.data ?? []) {
      catOf[q.id] = q.category
      totals[q.category] = (totals[q.category] ?? 0) + 1
    }

    const mastered: Record<string, number> = {}
    const reviewing: Record<string, number> = {}
    for (const p of progressRes.data ?? []) {
      const cat = catOf[p.question_id]
      if (!cat) continue
      if (p.mastered) mastered[cat] = (mastered[cat] ?? 0) + 1
      else reviewing[cat] = (reviewing[cat] ?? 0) + 1
    }

    setProgress(
      CATEGORIES.map((category) => ({
        category,
        totalQuestions: totals[category] ?? 0,
        mastered: mastered[category] ?? 0,
        reviewing: reviewing[category] ?? 0,
      }))
    )
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  return { progress, loading, error, refetch: fetchProgress }
}

// --------------------
// ホーム画面用のまとめデータ
// --------------------
export function useHomeData(userId: string | null) {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHome = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [questionsRes, progressRes, logsRes] = await Promise.all([
      supabase.from('questions').select('id, category'),
      supabase
        .from('user_progress')
        .select('question_id, mastered, next_review_at, is_correct')
        .eq('user_id', userId),
      supabase
        .from('answer_logs')
        .select('question_id, is_correct')
        .eq('user_id', userId)
        .gte('answered_at', startOfToday.toISOString()),
    ])

    if (questionsRes.error || progressRes.error || logsRes.error) {
      setError(
        questionsRes.error?.message ??
          progressRes.error?.message ??
          logsRes.error?.message ??
          '不明なエラー'
      )
      setLoading(false)
      return
    }

    const catOf: Record<string, string> = {}
    const totals: Record<string, number> = {}
    const answeredByCat: Record<string, number> = {}
    for (const q of questionsRes.data ?? []) {
      catOf[q.id] = q.category
      totals[q.category] = (totals[q.category] ?? 0) + 1
    }

    // 今日の学習
    const todayCount = logsRes.data?.length ?? 0
    const todayCorrect = (logsRes.data ?? []).filter((l) => l.is_correct).length

    // カテゴリ別・復習待ち / 成長度
    const now = Date.now()
    const dueByCategory: Record<string, number> = {}
    const masteredByCat: Record<string, number> = {}
    const reviewingByCat: Record<string, number> = {}
    for (const p of progressRes.data ?? []) {
      const cat = catOf[p.question_id]
      if (!cat) continue
      answeredByCat[cat] = (answeredByCat[cat] ?? 0) + 1
      if (p.mastered) {
        masteredByCat[cat] = (masteredByCat[cat] ?? 0) + 1
      } else {
        reviewingByCat[cat] = (reviewingByCat[cat] ?? 0) + 1
        const due =
          !p.is_correct ||
          (p.next_review_at != null && Date.parse(p.next_review_at) <= now)
        if (due) dueByCategory[cat] = (dueByCategory[cat] ?? 0) + 1
      }
    }

    // おすすめ = まだ手をつけていない問題が最も多いカテゴリ
    let recommended: HomeData['recommended'] = null
    let bestUntouched = 0
    for (const category of CATEGORIES) {
      const untouched = (totals[category] ?? 0) - (answeredByCat[category] ?? 0)
      if (untouched > bestUntouched) {
        bestUntouched = untouched
        recommended = { category, count: Math.min(untouched, 5) }
      }
    }

    const progress: CategoryProgress[] = CATEGORIES.map((category) => ({
      category,
      totalQuestions: totals[category] ?? 0,
      mastered: masteredByCat[category] ?? 0,
      reviewing: reviewingByCat[category] ?? 0,
    }))

    setData({ todayCount, todayCorrect, dueByCategory, recommended, progress })
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchHome()
  }, [fetchHome])

  return { data, loading, error, refetch: fetchHome }
}

// --------------------
// ユーザーの回答済み状況を取得
// --------------------
export function useUserProgress(userId: string | null) {
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchProgress = async () => {
      const { data } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)

      setProgress(data ?? [])
      setLoading(false)
    }

    fetchProgress()
  }, [userId])

  return { progress, loading }
}
