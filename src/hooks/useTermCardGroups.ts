import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Question } from '../types/database'

// グループ探しゲームで表示するカード（用語カードの表示に必要な項目のみ）
export type TermCard = Pick<Question, 'id' | 'question' | 'explanation' | 'explanation_easy'>

export interface TermCardRound {
  groupId: string
  groupName: string
  cards: TermCard[] // 正解グループ＋ダミーをシャッフルした表示用一覧
  correctIds: string[] // 正解グループに属するカードの id
}

const MIN_TOTAL = 6
const MAX_TOTAL = 9

// Fisher-Yates シャッフル（元配列は変更しない）
function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// プレイヤーの選択がちょうど正解グループと一致するか
export function isExactMatch(selected: Set<string>, correctIds: string[]): boolean {
  if (selected.size !== correctIds.length) return false
  return correctIds.every((id) => selected.has(id))
}

// term_card_groups / term_card_group_members は SELECT のみで利用する
export function useTermCardGroups() {
  const [round, setRound] = useState<TermCardRound | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRound = useCallback(async () => {
    setLoading(true)
    setError(null)

    // 1) グループを1つランダムに選ぶ
    const { data: groups, error: groupsError } = await supabase
      .from('term_card_groups')
      .select('id, name')

    if (groupsError) {
      setError(groupsError.message)
      setLoading(false)
      return
    }
    if (!groups || groups.length === 0) {
      setError('グループが登録されていません')
      setLoading(false)
      return
    }
    const group = groups[Math.floor(Math.random() * groups.length)]

    // 2) そのグループのメンバー（question_id）を取得
    const { data: members, error: membersError } = await supabase
      .from('term_card_group_members')
      .select('question_id')
      .eq('group_id', group.id)

    if (membersError) {
      setError(membersError.message)
      setLoading(false)
      return
    }
    const memberIds = (members ?? []).map((m) => m.question_id as string)

    // 3) 正解カードの本体と、ダミー候補（用語カード全件）を取得
    const [correctRes, poolRes] = await Promise.all([
      supabase
        .from('questions')
        .select('id, question, explanation, explanation_easy')
        .in('id', memberIds),
      supabase
        .from('questions')
        .select('id, question, explanation, explanation_easy')
        .eq('type', '用語カード'),
    ])

    if (correctRes.error || poolRes.error) {
      setError(correctRes.error?.message ?? poolRes.error?.message ?? '不明なエラー')
      setLoading(false)
      return
    }

    const correctCards = correctRes.data ?? []
    const memberIdSet = new Set(memberIds)
    const dummyPool = (poolRes.data ?? []).filter((q) => !memberIdSet.has(q.id))

    // 画面合計 6〜9枚程度になるようダミー枚数を決める
    const target = MIN_TOTAL + Math.floor(Math.random() * (MAX_TOTAL - MIN_TOTAL + 1))
    const dummyCount = Math.min(dummyPool.length, Math.max(0, target - correctCards.length))
    const dummyCards = shuffle(dummyPool).slice(0, dummyCount)

    setRound({
      groupId: group.id,
      groupName: group.name,
      cards: shuffle([...correctCards, ...dummyCards]),
      correctIds: correctCards.map((c) => c.id),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRound()
  }, [loadRound])

  return { round, loading, error, nextRound: loadRound }
}
