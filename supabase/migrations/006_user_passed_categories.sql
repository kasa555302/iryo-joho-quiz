-- ============================================================
-- 「合格済み科目を除外する」設定用テーブル
--
-- 【なぜ必要か】
--   医療情報技師試験は3科目に分かれ、過去に合格した科目は次回受験時に
--   免除される。すでに合格した科目はもう出題しないようにしたい。
--
-- 【変更内容】
--   user_passed_categories テーブルを新規作成。
--   1ユーザー・1カテゴリにつき「合格済みにした」という記録を1行持つ。
--   主キーは (user_id, category) とし、同じカテゴリの重複行を防ぐ。
--
-- 【既存データへの影響】
--   新規テーブルの追加のみ。questions・user_progress・term_card_groups・
--   term_card_group_members など既存テーブルへの変更は一切ない。
--   このテーブルに行が無いユーザーは「全カテゴリ未合格」として扱われ、
--   出題内容は今までと変わらない。
--
-- 【ロールバック】
--   drop table if exists public.user_passed_categories;
-- ============================================================

create table if not exists public.user_passed_categories (
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null check (category in (
                '医学・医療系',
                '情報処理技術系',
                '医療情報システム系'
              )),
  created_at  timestamptz not null default now(),
  primary key (user_id, category)
);

-- RLS: user_progress と同じ方針（本人の行のみ SELECT/INSERT/DELETE 可）
alter table public.user_passed_categories enable row level security;

create policy "user_passed_categories_select_own"
  on public.user_passed_categories
  for select
  using (auth.uid() = user_id);

create policy "user_passed_categories_insert_own"
  on public.user_passed_categories
  for insert
  with check (auth.uid() = user_id);

create policy "user_passed_categories_delete_own"
  on public.user_passed_categories
  for delete
  using (auth.uid() = user_id);

-- テーブルレベルの権限（RLS の前にこれが無いと permission denied になる）
grant select, insert, delete on public.user_passed_categories to authenticated;

create index if not exists idx_user_passed_categories_user
  on public.user_passed_categories (user_id);
