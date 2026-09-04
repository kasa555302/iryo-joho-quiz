-- ============================================================
-- Phase 4: 問題形式の拡張（5択 / ○× / 用語カード）
--
-- 【なぜ必要か】
--   現状 questions は5択専用。○×問題・用語カード（表裏めくり）を
--   扱うには問題形式の区別と、選択肢・正解番号を持たない行の許容が要る。
--
-- 【変更内容】
--   1) questions.type カラムを追加（DEFAULT '5択'。既存行は自動で5択扱い）
--   2) choice1..5 と answer を NULL 許容に変更（○×・用語カードでは未使用）
--      ※ 既存の «answer between 1 and 5» CHECK は NULL を通すため変更不要
--
-- 【既存データへの影響】
--   - 既存 15 問はすべて type='5択'、選択肢・正解はそのまま。非破壊
--   - アプリ側は type を見て表示を切り替える（5択の挙動は変わらない）
--
-- 【ロールバック】
--   末尾の «ROLLBACK» を実行。ただし先に 5択以外の行を削除しておくこと
--   （NOT NULL を戻すため）
-- ============================================================

alter table public.questions
  add column if not exists type text not null default '5択';

alter table public.questions
  drop constraint if exists questions_type_check;
alter table public.questions
  add constraint questions_type_check
  check (type in ('5択', '○×', '用語カード'));

alter table public.questions
  alter column choice1 drop not null,
  alter column choice2 drop not null,
  alter column choice3 drop not null,
  alter column choice4 drop not null,
  alter column choice5 drop not null,
  alter column answer  drop not null;

-- ============================================================
-- 追加のサンプル問題（○× 6問 / 用語カード 6問）
--   ○×      : answer = 1（正しい） / 2（誤り）、choice は未使用
--   用語カード: question=用語、explanation=意味。answer は未使用（自己採点）
-- ============================================================
insert into public.questions
  (type, question, choice1, choice2, choice3, choice4, choice5, answer, category, explanation)
values
-- ---- ○× ----
('○×', 'DICOM は医用画像の保存・通信に関する国際標準規格である。',
  null, null, null, null, null, 1, '医療情報システム系',
  '正しい。DICOM は CT・MRI・X線などの医用画像と付帯情報を統一的に扱う国際標準で、PACS で利用される。'),
('○×', 'SS-MIX2 はレセプト（診療報酬明細書）を電子請求するための仕組みである。',
  null, null, null, null, null, 2, '医療情報システム系',
  '誤り。SS-MIX2 は標準化ストレージで、HL7 v2.5 メッセージをファイル保存し医療機関間の診療情報共有に使う。レセプト請求はレセコン（ORCA 等）の役割。'),
('○×', 'AES は共通鍵（対称鍵）暗号方式のアルゴリズムである。',
  null, null, null, null, null, 1, '情報処理技術系',
  '正しい。AES はブロック長128ビットの共通鍵ブロック暗号。RSA などの公開鍵暗号とは異なる。'),
('○×', 'HTTPS は TCP/IP の4層モデルでトランスポート層に位置するプロトコルである。',
  null, null, null, null, null, 2, '情報処理技術系',
  '誤り。HTTPS（HTTP over TLS）はアプリケーション層のプロトコル。TLS はトランスポート層の上で動作する。'),
('○×', '特定機能病院の承認要件には「救急医療を提供していること」が含まれる。',
  null, null, null, null, null, 2, '医学・医療系',
  '誤り。承認要件は「高度医療の提供・開発・評価」「400床以上」「16以上の診療科」など。救急医療の提供は要件ではない。'),
('○×', 'SOAP 形式の「O」は客観的情報（Objective：検査値・所見）を指す。',
  null, null, null, null, null, 1, '医学・医療系',
  '正しい。SOAP は Subjective（主観的情報）・Objective（客観的情報）・Assessment（評価）・Plan（計画）の頭文字。'),
-- ---- 用語カード ----
('用語カード', 'PACS', null, null, null, null, null, null, '医療情報システム系',
  '医用画像を保存・管理・表示するシステム（Picture Archiving and Communication System）。CT や MRI で撮影した画像をサーバーに蓄積し、院内の端末から参照できるようにする。DICOM 規格で画像をやり取りする。'),
('用語カード', 'HL7 FHIR', null, null, null, null, null, null, '医療情報システム系',
  '医療情報を交換するための新しい標準規格。RESTful API と JSON/XML を使い、患者・検査値・処方などを「リソース」という単位で扱う。Web の技術に近く、実装しやすいのが特徴。'),
('用語カード', 'レセプト', null, null, null, null, null, null, '医学・医療系',
  '診療報酬明細書のこと。医療機関が保険者（健康保険組合など）に医療費を請求するために、患者ごと・月ごとに作成する。作成・請求を行うソフトをレセコン（例：ORCA）と呼ぶ。'),
('用語カード', 'DPC', null, null, null, null, null, null, '医学・医療系',
  '診断群分類のこと（Diagnosis Procedure Combination）。急性期入院医療で、診断群分類ごとに1日当たりの包括点数を定めた支払い方式。手術・麻酔など一部は出来高で算定する。'),
('用語カード', '公開鍵暗号', null, null, null, null, null, null, '情報処理技術系',
  '暗号化と復号で別々の鍵（公開鍵・秘密鍵）を使う方式。公開鍵で暗号化したものは対応する秘密鍵でしか復号できない。RSA や楕円曲線暗号が代表例で、電子署名や TLS の鍵交換に使われる。'),
('用語カード', 'CIA（情報セキュリティ）', null, null, null, null, null, null, '情報処理技術系',
  '情報セキュリティの3要素。Confidentiality（機密性：許可された人だけが見られる）、Integrity（完全性：改ざんされていない）、Availability（可用性：必要なときに使える）の頭文字。');

-- ============================================================
-- «ROLLBACK»  ← 元に戻す場合（先に 5択以外の行を削除してから）
-- ============================================================
-- delete from public.questions where type <> '5択';
-- alter table public.questions
--   alter column choice1 set not null,
--   alter column choice2 set not null,
--   alter column choice3 set not null,
--   alter column choice4 set not null,
--   alter column choice5 set not null,
--   alter column answer  set not null;
-- alter table public.questions drop constraint if exists questions_type_check;
-- alter table public.questions drop column if exists type;
