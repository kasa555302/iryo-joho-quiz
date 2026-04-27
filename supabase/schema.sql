-- ============================================================
-- 医療情報技師学習アプリ スキーマ定義
-- ============================================================

-- --------------------
-- questions テーブル
-- --------------------
create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,                          -- 問題文
  choice1     text not null,                          -- 選択肢1
  choice2     text not null,                          -- 選択肢2
  choice3     text not null,                          -- 選択肢3
  choice4     text not null,                          -- 選択肢4
  choice5     text not null,                          -- 選択肢5
  answer      smallint not null check (answer between 1 and 5), -- 正解番号（1〜5）
  category    text not null check (category in (
                '医学・医療系',
                '情報処理技術系',
                '医療情報システム系'
              )),
  explanation text not null,                          -- 解説
  created_at  timestamptz not null default now()
);

-- --------------------
-- user_progress テーブル
-- --------------------
create table if not exists public.user_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  is_correct  boolean not null,                       -- 正解フラグ
  answered_at timestamptz not null default now(),
  -- 同じユーザー・同じ問題の最新回答を upsert するためのユニーク制約
  unique (user_id, question_id)
);

-- --------------------
-- RLS（行レベルセキュリティ）
-- --------------------

-- questions: RLS 有効化
alter table public.questions enable row level security;

-- questions: 全ユーザー（認証済み・未認証とも）が参照可能
create policy "questions_select_all"
  on public.questions
  for select
  using (true);

-- user_progress: RLS 有効化
alter table public.user_progress enable row level security;

-- user_progress: 自分の回答履歴のみ参照可能
create policy "user_progress_select_own"
  on public.user_progress
  for select
  using (auth.uid() = user_id);

-- user_progress: 自分の回答のみ登録可能
create policy "user_progress_insert_own"
  on public.user_progress
  for insert
  with check (auth.uid() = user_id);

-- user_progress: 自分の回答のみ更新可能
create policy "user_progress_update_own"
  on public.user_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --------------------
-- インデックス（検索高速化）
-- --------------------
create index if not exists idx_questions_category
  on public.questions (category);

create index if not exists idx_user_progress_user_id
  on public.user_progress (user_id);

create index if not exists idx_user_progress_question_id
  on public.user_progress (question_id);
