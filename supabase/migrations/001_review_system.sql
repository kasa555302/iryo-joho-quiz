-- ============================================================
-- Phase 1: 苦手問題優先システム / 学習の見える化
--
-- 【なぜ必要か】
--   現状は user_progress が「1ユーザー1問=1行」で、最後の回答だけを保持する。
--   そのため「間違えたが後で正解した問題」が苦手リストから即座に消え、
--   間隔をあけた再出題・克服判定・学習量の可視化ができない。
--
-- 【変更内容】
--   1) answer_logs テーブルを新規追加（全回答の追記ログ。集計と「今日の学習」用）
--   2) user_progress に復習スケジュール用のカラムを追加（すべて DEFAULT 付き）
--
-- 【既存データへの影響】
--   - answer_logs は新規テーブルのため既存データに影響なし
--   - user_progress への ADD COLUMN はすべて DEFAULT 付き。既存 15 行・
--     既存ユーザーの回答行はそのまま残り、新カラムは既定値で埋まる
--   - 既存の upsert(onConflict: user_id,question_id) はそのまま動作する
--
-- 【ロールバック】
--   このファイル末尾の «ROLLBACK» ブロックを実行すれば完全に元に戻せる
--   （追加テーブル削除・追加カラム削除のみ。既存データは不変）
-- ============================================================

-- ------------------------------------------------------------
-- 1) answer_logs: 全回答の追記ログ
-- ------------------------------------------------------------
create table if not exists public.answer_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  is_correct  boolean not null,
  answered_at timestamptz not null default now()
);

alter table public.answer_logs enable row level security;

create policy "answer_logs_select_own"
  on public.answer_logs for select
  using (auth.uid() = user_id);

create policy "answer_logs_insert_own"
  on public.answer_logs for insert
  with check (auth.uid() = user_id);

create index if not exists idx_answer_logs_user_answered
  on public.answer_logs (user_id, answered_at desc);

-- ------------------------------------------------------------
-- 2) user_progress: 復習スケジュール用カラム
--    streak          … 現在の連続正解数（不正解で 0 に戻る）
--    mastered        … 克服フラグ（連続 3 回正解で true）
--    next_review_at  … 次に出題してよい日時（null = 未スケジュール）
--    total_answers   … この問題への累計回答数
--    correct_answers … この問題への累計正解数
-- ------------------------------------------------------------
alter table public.user_progress
  add column if not exists streak          integer     not null default 0,
  add column if not exists mastered        boolean     not null default false,
  add column if not exists next_review_at  timestamptz,
  add column if not exists total_answers   integer     not null default 0,
  add column if not exists correct_answers integer     not null default 0;

-- 既存行の累計値を「最後の1回」で初期化しておく（任意・非破壊）
update public.user_progress
  set total_answers = 1,
      correct_answers = case when is_correct then 1 else 0 end
  where total_answers = 0;

create index if not exists idx_user_progress_review
  on public.user_progress (user_id, mastered, next_review_at);

-- ============================================================
-- «ROLLBACK»  ← 元に戻す場合はここから下だけを実行
-- ============================================================
-- drop table if exists public.answer_logs;
-- alter table public.user_progress
--   drop column if exists streak,
--   drop column if exists mastered,
--   drop column if exists next_review_at,
--   drop column if exists total_answers,
--   drop column if exists correct_answers;
