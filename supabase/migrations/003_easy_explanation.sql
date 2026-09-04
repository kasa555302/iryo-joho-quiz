-- ============================================================
-- Phase 5: 超初心者向け解説
--
-- 【なぜ必要か】
--   現状の explanation は用語の定義中心で、医療IT初心者には難しい。
--   「専門用語 → やさしい言葉 → 医療現場の具体例」の順でかみ砕いた
--   短い説明を、既存の解説とは別に持たせたい。
--
-- 【変更内容】
--   questions.explanation_easy カラムを追加（text, NULL 許容）。
--   既存 explanation は一切変更しない。アプリは値がある問題だけ
--   「やさしく言うと」ボックスを追加表示する。
--
-- 【既存データへの影響】
--   NULL 許容カラムの追加のみ。既存行は explanation_easy = NULL のまま。非破壊。
--
-- 【ロールバック】
--   alter table public.questions drop column if exists explanation_easy;
-- ============================================================

alter table public.questions
  add column if not exists explanation_easy text;

-- ------------------------------------------------------------
-- やさしい解説の投入（question 文の前方一致で対象を特定）
-- ------------------------------------------------------------
update public.questions set explanation_easy =
  'コードの最初のアルファベットは「どの種類の病気か」のグループ分け。同じ仲間の病気は同じ文字でまとまる、というイメージ。健診結果や統計で病気を数える場面で使われる。'
  where question like 'ICD-10%';

update public.questions set explanation_easy =
  'DPCは「この病気で入院したら1日いくら」とあらかじめ決めておく入院費の計算方法。使った分だけ足し算する「出来高」と違い、手術など一部を除いて定額。急性期の入院病棟で使われる。'
  where question like 'DPC（診断群分類）制度について%';

update public.questions set explanation_easy =
  'カルテの書き方の型。S=患者さんの訴え、O=検査や診察で分かった事実、A=それをどう考えるか、P=これからどうするか。看護記録や電子カルテの記載でよく使う。'
  where question like '電子カルテの「SOAP形式」%';

update public.questions set explanation_easy =
  '特定機能病院は大学病院など「高度な医療と研究をする大きな病院」。400床以上・16診療科以上などが条件。救急をやっているかどうかは条件に入っていない。'
  where question like '次のうち、特定機能病院の承認要件%';

update public.questions set explanation_easy =
  'FHIRは医療データをやり取りするための新しい共通ルール。患者・検査結果・処方などを「リソース」という部品に分け、Webの技術（API・JSON）で送受信する。他システム連携の場面で登場する。'
  where question like 'HL7 FHIR における「リソース」%';

update public.questions set explanation_easy =
  'AESは「同じ鍵で鍵をかけて、同じ鍵で開ける」タイプの暗号（共通鍵）。処理が速く、ファイルや通信の暗号化に広く使われる。RSAのような「公開鍵」とは仕組みが違う。'
  where question like 'AES（Advanced Encryption Standard）%';

update public.questions set explanation_easy =
  'HTTPSは「https://」で始まる暗号化された通信。役割としてはWebページを表示するアプリの層の仕組みで、その下でTLSが暗号化を担当している。'
  where question like 'TCP/IPの4層モデルでHTTPSが動作する層%';

update public.questions set explanation_easy =
  'JOINは「複数の表をキー（共通のID）でくっつけて1つの表として見る」命令。例：患者表と検査表を患者IDでつなぐ。'
  where question like 'リレーショナルデータベースにおいて、複数テーブルを結合するSQL句%';

update public.questions set explanation_easy =
  '情報を守る3つの柱。機密性=見てよい人だけが見られる、完全性=勝手に書き換えられていない、可用性=使いたいときに使える。病院システムの安全対策の基本。'
  where question like '情報セキュリティの「CIA」%';

update public.questions set explanation_easy =
  '過学習=練習問題は完璧だが本番で解けない状態。防ぐには一部の情報をわざと隠す・データを増やす・途中で学習を止めるなど。学習率を上げるのは逆効果。'
  where question like 'ディープラーニングにおいて、過学習を防ぐ手法%';

update public.questions set explanation_easy =
  'SS-MIX2は「どの電子カルテでも読める形でデータを保管する共通の倉庫」。病院ごとにバラバラなカルテでも、地域連携や他院への情報共有ができるようにする。'
  where question like 'SS-MIX2%目的として最も適切なもの%';

update public.questions set explanation_easy =
  'ORCAは日本医師会が作った「レセコン（医療費の請求書を作るソフト）」。診察料や薬代を計算し、保険者へ請求する書類を作る。電子カルテとは別物で、連携して使う。'
  where question like '病院情報システムにおけるORCA%';

update public.questions set explanation_easy =
  'DICOMは「CT・MRI・レントゲンの画像を、機種やメーカーが違っても同じように扱うための共通ルール」。撮った画像をPACSに送って表示するときにも使われる。'
  where question like 'DICOM（Digital Imaging and Communications in Medicine）の説明%';

update public.questions set explanation_easy =
  '電子処方箋では、紙の代わりに「国が運営するオンラインの仕組み」に本物の処方情報が保管される。病院も薬局もそこにアクセスして処方を確認・調剤する。'
  where question like '電子処方箋の仕組みにおいて、処方箋の正本%';

update public.questions set explanation_easy =
  'XDSは「地域の病院どうしで、退院サマリや検査結果などの文書を登録・検索・閲覧できるようにする仕組み」。地域医療連携ネットワークの土台になる。'
  where question like '地域医療情報連携ネットワークで利用されるIHE%';

-- ○×
update public.questions set explanation_easy =
  'DICOM=医用画像の共通ルール、で正しい。CT・MRIの画像をどの機種でも同じように扱えるようにするもの。'
  where question like 'DICOM は医用画像の保存・通信に関する国際標準規格である。%';

update public.questions set explanation_easy =
  'SS-MIX2はデータを保管して共有するための「共通の倉庫」。医療費の請求はレセコン（ORCAなど）の仕事なので、この文は誤り。'
  where question like 'SS-MIX2 はレセプト%電子請求するための仕組みである。%';

update public.questions set explanation_easy =
  'AESは「同じ鍵でかけて同じ鍵で開ける」共通鍵暗号。正しい。'
  where question like 'AES は共通鍵（対称鍵）暗号方式のアルゴリズムである。%';

update public.questions set explanation_easy =
  'HTTPSはWebページを扱うアプリの層の仕組みで、トランスポート層ではない。だからこの文は誤り。'
  where question like 'HTTPS は TCP/IP の4層モデルでトランスポート層に位置する%';

update public.questions set explanation_easy =
  '特定機能病院の条件は「高度医療・研究」「400床以上」「16診療科以上」など。救急の提供は条件ではないので誤り。'
  where question like '特定機能病院の承認要件には「救急医療を提供していること」%';

update public.questions set explanation_easy =
  'SOAPのO（Objective）は「検査値や診察所見など、事実として分かったこと」。正しい。'
  where question like 'SOAP 形式の「O」は客観的情報%';
