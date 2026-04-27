import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Question, UserProgress, CategoryStat, Category } from '../types/database'

// --------------------
// 問題一覧の取得（カテゴリ絞り込み対応）
// --------------------
export function useQuestions(category?: Category) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase.from('questions').select('*').order('created_at')

    // カテゴリが指定されている場合は絞り込む
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setQuestions(data ?? [])
    }
    setLoading(false)
  }, [category])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  return { questions, loading, error, refetch: fetchQuestions }
}

// --------------------
// 苦手問題（不正解の問題）のみ取得
// --------------------
export function useWeakQuestions(userId: string | null) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchWeakQuestions = async () => {
      setLoading(true)
      setError(null)

      // 不正解の question_id を取得
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('question_id')
        .eq('user_id', userId)
        .eq('is_correct', false)

      if (progressError) {
        setError(progressError.message)
        setLoading(false)
        return
      }

      const questionIds = (progressData ?? []).map((p) => p.question_id)

      if (questionIds.length === 0) {
        setQuestions([])
        setLoading(false)
        return
      }

      // 不正解の問題を取得
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds)
        .order('created_at')

      if (error) {
        setError(error.message)
      } else {
        setQuestions(data ?? [])
      }
      setLoading(false)
    }

    fetchWeakQuestions()
  }, [userId])

  return { questions, loading, error }
}

// --------------------
// 回答を記録する（INSERT or UPDATE）
// --------------------
export function useRecordAnswer() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recordAnswer = useCallback(
    async (userId: string, questionId: string, isCorrect: boolean) => {
      setSaving(true)
      setError(null)

      // user_id + question_id の一意制約を利用して upsert
      const { error } = await supabase.from('user_progress').upsert(
        {
          user_id: userId,
          question_id: questionId,
          is_correct: isCorrect,
          answered_at: new Date().toISOString(),
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
