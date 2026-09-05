-- ============================================================
-- 用語カード グループ探しゲーム用テーブルへの権限付与（念のため）
--
-- 【背景】
--   term_card_groups / term_card_group_members はユーザー側で
--   既に作成・データ投入済み。過去に answer_logs で「テーブルレベル
--   の GRANT が無く permission denied になる」事象があったため、
--   同じ事象を避けるために SELECT 権限を明示しておく。
--   既に付与済みでも GRANT は再実行して問題ない。
--
-- 【変更内容】
--   SELECT 権限のみ付与（アプリはこの2テーブルを読み取り専用で使う）。
--
-- 【既存データへの影響】
--   なし（権限付与のみ）。
--
-- 【ロールバック】
--   revoke select on public.term_card_groups from authenticated;
--   revoke select on public.term_card_group_members from authenticated;
-- ============================================================

grant select on public.term_card_groups to authenticated;
grant select on public.term_card_group_members to authenticated;

-- ------------------------------------------------------------
-- 補足: もし作成時に RLS (Row Level Security) を有効化していて
-- SELECT ポリシーを設定していない場合、上記 GRANT だけでは
-- 読み取れません。その場合は以下も実行してください
-- （questions テーブルの "questions_select_all" と同じ考え方で、
-- 全ユーザーが参照できる共通のゲームデータとして扱います）。
-- ------------------------------------------------------------
-- alter table public.term_card_groups enable row level security;
-- create policy "term_card_groups_select_all"
--   on public.term_card_groups for select using (true);
--
-- alter table public.term_card_group_members enable row level security;
-- create policy "term_card_group_members_select_all"
--   on public.term_card_group_members for select using (true);
