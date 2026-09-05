import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types/database'

// 「合格済み科目」の登録状況（設定画面のトグル用）
export function usePassedCategories(userId: string | null) {
  const [passed, setPassed] = useState<Set<Category>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPassed = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('user_passed_categories')
      .select('category')
      .eq('user_id', userId)

    if (error) {
      setError(error.message)
    } else {
      setPassed(new Set((data ?? []).map((row) => row.category as Category)))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPassed()
  }, [fetchPassed])

  // ON にする = INSERT（合格済みとして記録）、OFF にする = DELETE
  const setCategoryPassed = useCallback(
    async (category: Category, isPassed: boolean): Promise<string | null> => {
      if (!userId) return 'ログインしていません'

      if (isPassed) {
        const { error } = await supabase
          .from('user_passed_categories')
          .insert({ user_id: userId, category })
        if (error) return error.message
        setPassed((prev) => new Set(prev).add(category))
      } else {
        const { error } = await supabase
          .from('user_passed_categories')
          .delete()
          .eq('user_id', userId)
          .eq('category', category)
        if (error) return error.message
        setPassed((prev) => {
          const next = new Set(prev)
          next.delete(category)
          return next
        })
      }
      return null
    },
    [userId]
  )

  return { passed, loading, error, setCategoryPassed, refetch: fetchPassed }
}
