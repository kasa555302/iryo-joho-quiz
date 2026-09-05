-- ============================================================
-- explanation / explanation_easy 統合 ステップ2
--
-- 【目的】
--   解説を explanation 1本に統合するための第1段階。
--   explanation_easy 側にある「良い比喩・具体例・かみ砕いた言い回し」を
--   持つ 20 行だけ、explanation の末尾に1文を追加する形で取り込む。
--   （explanation_easy 列はこの段階では削除しない。アプリ改修と
--    最終確認のあと、別マイグレーションで DROP COLUMN する）
--
-- 【安全設計】
--   各 UPDATE は question と「現在の explanation 全文」の両方が一致する
--   行だけを更新する。過去に手動編集していた場合はその文が一致せず
--   0 行更新になるため、実行後の件数で検知できる。
--   SET するのは explanation のみ。question / choice1..5 / answer / type /
--   category / explanation_easy には一切触れない。
--
-- 【想定結果】
--   20 行更新（psql なら "UPDATE 1" が 20 回）。
--
-- 【ロールバック】
--   末尾の «ROLLBACK» ブロックを実行すると、追加した1文を取り除いて
--   元の explanation に戻す。
-- ============================================================

begin;

-- 1. ICD-10 先頭文字（医学・医療系 / 5択）
update public.questions set explanation =
  'ICD-10のコードはアルファベット1文字＋数字2桁＋小数点以下の構成。先頭の英字は疾患の大分類（章）を示し、同じ系統・部位の疾患がまとめられている。たとえば健診結果の集計や疾病統計など、病気を種類ごとに数える場面で使われる。'
where question = 'ICD-10（国際疾病分類第10版）において、疾病分類コードの先頭文字が示すものはどれか。'
  and explanation = 'ICD-10のコードはアルファベット1文字＋数字2桁＋小数点以下の構成。先頭の英字は疾患の大分類（章）を示し、同じ系統・部位の疾患がまとめられている。';

-- 2. 特定機能病院の承認要件（医学・医療系 / 5択）
update public.questions set explanation =
  '特定機能病院の承認要件（医療法）は「高度医療の提供・開発・評価」「400床以上」「16以上の診療科」「集中治療室など施設基準」など。救急医療の提供は要件に含まれていない。大学病院など「高度な医療と研究を行う大きな病院」がこれにあたる。'
where question = '次のうち、特定機能病院の承認要件として定められていないものはどれか。'
  and explanation = '特定機能病院の承認要件（医療法）は「高度医療の提供・開発・評価」「400床以上」「16以上の診療科」「集中治療室など施設基準」など。救急医療の提供は要件に含まれていない。';

-- 3. AES（情報処理技術系 / 5択）
update public.questions set explanation =
  'AESはNISTが標準化した共通鍵ブロック暗号。ブロック長128ビット、鍵長は128/192/256ビットから選択可能。DESの後継として広く利用されている。共通鍵暗号とは「同じ鍵で暗号化し、同じ鍵で復号する」方式で、公開鍵暗号（RSA等）とは仕組みが異なる。'
where question = 'AES（Advanced Encryption Standard）について正しい記述はどれか。'
  and explanation = 'AESはNISTが標準化した共通鍵ブロック暗号。ブロック長128ビット、鍵長は128/192/256ビットから選択可能。DESの後継として広く利用されている。';

-- 4. HTTPS が動作する層（情報処理技術系 / 5択）
update public.questions set explanation =
  'HTTPS（HTTP over TLS）はアプリケーション層プロトコル。TLSはトランスポート層の上で動作するセキュリティプロトコル。TCP/IPの4層ではアプリケーション層に位置する。ふだんブラウザで見る「https://」で始まる通信がこれにあたる。'
where question = 'TCP/IPの4層モデルでHTTPSが動作する層はどれか。'
  and explanation = 'HTTPS（HTTP over TLS）はアプリケーション層プロトコル。TLSはトランスポート層の上で動作するセキュリティプロトコル。TCP/IPの4層ではアプリケーション層に位置する。';

-- 5. JOIN（情報処理技術系 / 5択）
update public.questions set explanation =
  'JOINはリレーショナルデータベースで複数テーブルを関連付けて結合する句。INNER JOIN・LEFT JOIN・RIGHT JOINなどの種類がある。GROUP BYは集計、ORDER BYは並び替えに使う。たとえば患者テーブルと検査テーブルを患者IDでつなぎ、1つの表のように扱う。'
where question = 'リレーショナルデータベースにおいて、複数テーブルを結合するSQL句はどれか。'
  and explanation = 'JOINはリレーショナルデータベースで複数テーブルを関連付けて結合する句。INNER JOIN・LEFT JOIN・RIGHT JOINなどの種類がある。GROUP BYは集計、ORDER BYは並び替えに使う。';

-- 6. CIA（情報処理技術系 / 5択）
update public.questions set explanation =
  'CIAはConfidentiality（機密性）・Integrity（完全性）・Availability（可用性）の頭文字。ISO/IEC 27001など情報セキュリティ管理の基本概念として定義されている。かみ砕くと「見てよい人だけが見られる（機密性）・改ざんされていない（完全性）・使いたいときに使える（可用性）」の3本柱である。'
where question = '情報セキュリティの「CIA」が意味する3要素の組み合わせとして正しいものはどれか。'
  and explanation = 'CIAはConfidentiality（機密性）・Integrity（完全性）・Availability（可用性）の頭文字。ISO/IEC 27001など情報セキュリティ管理の基本概念として定義されている。';

-- 7. 過学習を防ぐ手法（情報処理技術系 / 5択）
update public.questions set explanation =
  '過学習防止には Dropout・データ拡張・正則化・Early Stopping などが有効。学習率を大きくすると損失関数の収束が不安定になり、過学習の防止にはならない。過学習とは「練習問題は完璧なのに本番では解けない」ような、訓練データに適合しすぎた状態を指す。'
where question = 'ディープラーニングにおいて、過学習を防ぐ手法として適切でないものはどれか。'
  and explanation = '過学習防止には Dropout・データ拡張・正則化・Early Stopping などが有効。学習率を大きくすると損失関数の収束が不安定になり、過学習の防止にはならない。';

-- 8. SS-MIX2 の目的（医療情報システム系 / 5択）
update public.questions set explanation =
  'SS-MIX2は厚生労働省が推進する標準化ストレージ。HL7 v2.5メッセージをファイルとして保存し、異なる電子カルテ間での診療情報共有・地域医療連携に活用される。いわば「どの電子カルテからでも読める共通形式でデータを置く倉庫」で、災害時のバックアップにも使われる。'
where question = 'SS-MIX2（Standardized Structured Medical record Information eXchange 2）の目的として最も適切なものはどれか。'
  and explanation = 'SS-MIX2は厚生労働省が推進する標準化ストレージ。HL7 v2.5メッセージをファイルとして保存し、異なる電子カルテ間での診療情報共有・地域医療連携に活用される。';

-- 9. SS-MIX2 はレセプト請求の仕組みか（医療情報システム系 / ○×）
update public.questions set explanation =
  '誤り。SS-MIX2 は標準化ストレージで、HL7 v2.5 メッセージをファイル保存し医療機関間の診療情報共有に使う。レセプト請求はレセコン（ORCA 等）の役割。SS-MIX2 は診療データを共通形式で保管する「倉庫」であり、医療費の請求機能は持たない。'
where question = 'SS-MIX2 はレセプト（診療報酬明細書）を電子請求するための仕組みである。'
  and explanation = '誤り。SS-MIX2 は標準化ストレージで、HL7 v2.5 メッセージをファイル保存し医療機関間の診療情報共有に使う。レセプト請求はレセコン（ORCA 等）の役割。';

-- 10. SOAP の「O」（医学・医療系 / ○×）
update public.questions set explanation =
  '正しい。SOAP は Subjective（主観的情報）・Objective（客観的情報）・Assessment（評価）・Plan（計画）の頭文字。O（Objective）は検査値や診察所見など「事実として確認できた情報」を指す。'
where question = 'SOAP 形式の「O」は客観的情報（Objective：検査値・所見）を指す。'
  and explanation = '正しい。SOAP は Subjective（主観的情報）・Objective（客観的情報）・Assessment（評価）・Plan（計画）の頭文字。';

-- 11. 特定健診とメタボ（医学・医療系 / ○×）
update public.questions set explanation =
  '正しい。特定健診は40〜74歳の医療保険加入者を対象に内臓脂肪症候群（メタボ）に着目して行われ、結果に応じて特定保健指導につなげる。メタボは腹囲（おなか周り）に加えて血圧・血糖・脂質の値で判定する。'
where question = '特定健康診査（特定健診）は、メタボリックシンドロームに着目した健診である。'
  and explanation = '正しい。特定健診は40〜74歳の医療保険加入者を対象に内臓脂肪症候群（メタボ）に着目して行われ、結果に応じて特定保健指導につなげる。';

-- 12. ACID（情報処理技術系 / 5択）
update public.questions set explanation =
  'ACIDは原子性・一貫性・分離性・持続性の頭字語。可用性はACIDには含まれず、分散システムのCAP定理などで扱う概念。かみ砕くと「全部やるか全部やめる／矛盾を残さない／他の処理と混ざらない／確定したら消えない」の4条件である。'
where question = 'データベースのトランザクションが満たすべき性質「ACID」に含まれないものはどれか。'
  and explanation = 'ACIDは原子性・一貫性・分離性・持続性の頭字語。可用性はACIDには含まれず、分散システムのCAP定理などで扱う概念。';

-- 13. 認証局（CA）の役割（情報処理技術系 / 5択）
update public.questions set explanation =
  '認証局（CA）は、公開鍵とその持ち主の対応を保証する電子証明書を発行し、失効管理を行う信頼の起点。いわば「この公開鍵は確かに本人のものだ」と第三者の立場で証明する役割を担う。'
where question = '公開鍵基盤（PKI）における認証局（CA）の役割はどれか。'
  and explanation = '認証局（CA）は、公開鍵とその持ち主の対応を保証する電子証明書を発行し、失効管理を行う信頼の起点。';

-- 14. 要配慮個人情報（情報処理技術系 / 5択）
update public.questions set explanation =
  '要配慮個人情報は、人種・信条・社会的身分・病歴・犯罪歴など、取扱いに特に配慮を要する情報。取得には原則本人の同意が必要で、診療情報の多くが該当する。知られると差別や偏見につながりやすいため、通常の個人情報より慎重な取扱いが求められる。'
where question = '個人情報保護法における「要配慮個人情報」に該当するものはどれか。'
  and explanation = '要配慮個人情報は、人種・信条・社会的身分・病歴・犯罪歴など、取扱いに特に配慮を要する情報。取得には原則本人の同意が必要で、診療情報の多くが該当する。';

-- 15. ファイアウォール（情報処理技術系 / 用語カード）
update public.questions set explanation =
  'ネットワークの境界で通信を監視し、あらかじめ定めた規則に従って通過／遮断する仕組み。外部からの不正アクセスを防ぐ。ネットワークの「関所」にあたり、ルールに合う通信だけを通して不審な通信を止める。'
where question = 'ファイアウォール'
  and explanation = 'ネットワークの境界で通信を監視し、あらかじめ定めた規則に従って通過／遮断する仕組み。外部からの不正アクセスを防ぐ。';

-- 16. VPN（情報処理技術系 / 用語カード）
update public.questions set explanation =
  'インターネットなどの公衆網の上に、暗号化された仮想的な専用線を作る技術。拠点間接続やリモートアクセスで通信を保護する。インターネットの中に「暗号化された自分専用のトンネル」を通すイメージで、外から中身を見られずに社内ネットへ接続できる。'
where question = 'VPN'
  and explanation = 'インターネットなどの公衆網の上に、暗号化された仮想的な専用線を作る技術。拠点間接続やリモートアクセスで通信を保護する。';

-- 17. ハッシュ関数（情報処理技術系 / 用語カード）
update public.questions set explanation =
  '任意長のデータから固定長の値（ハッシュ値）を求める一方向の関数。同じ入力は常に同じ値になり、わずかな違いで値が大きく変わる。改ざん検知やパスワード保管に使う。データの「指紋」を取るようなもので、中身が少しでも変わると値が全く変わるため改ざんに気づける。'
where question = 'ハッシュ関数'
  and explanation = '任意長のデータから固定長の値（ハッシュ値）を求める一方向の関数。同じ入力は常に同じ値になり、わずかな違いで値が大きく変わる。改ざん検知やパスワード保管に使う。';

-- 18. SS-MIX2 と HL7 v2（医療情報システム系 / ○×）
update public.questions set explanation =
  '正しい。SS-MIX2は患者基本情報・処方・検査結果などをHL7 v2.5メッセージにしてファイルで保管し、施設間共有や災害対策に活用する。いわば「どの施設からも読める共通形式でデータを置いておく倉庫」である。'
where question = 'SS-MIX2の標準化ストレージには、HL7 v2形式のデータがファイルとして格納される。'
  and explanation = '正しい。SS-MIX2は患者基本情報・処方・検査結果などをHL7 v2.5メッセージにしてファイルで保管し、施設間共有や災害対策に活用する。';

-- 19. オンライン資格確認（医療情報システム系 / ○×）
update public.questions set explanation =
  '正しい。オンライン資格確認等システムでは、患者の同意のもとで薬剤情報・特定健診情報・診療情報などを医療機関・薬局が閲覧でき、電子処方箋の基盤にもなっている。具体的には、患者がマイナ保険証を提示して同意すると、他院の薬や健診結果を医師が確認できる。'
where question = 'オンライン資格確認では、患者本人の同意があれば、他院で処方された薬剤情報や特定健診結果を医療機関が閲覧できる。'
  and explanation = '正しい。オンライン資格確認等システムでは、患者の同意のもとで薬剤情報・特定健診情報・診療情報などを医療機関・薬局が閲覧でき、電子処方箋の基盤にもなっている。';

-- 20. JLAC10（医療情報システム系 / 用語カード）
update public.questions set explanation =
  '日本臨床検査医学会が定める臨床検査項目分類コード。検査項目・材料・測定法などを体系的に表し、検査データの標準的な交換に用いる。たとえば血液検査の項目を全国共通の番号で表すことで、施設が違っても同じ検査だと判別できる。'
where question = 'JLAC10'
  and explanation = '日本臨床検査医学会が定める臨床検査項目分類コード。検査項目・材料・測定法などを体系的に表し、検査データの標準的な交換に用いる。';

commit;

-- ============================================================
-- 実行後の確認クエリ（別途 SELECT で実行）
-- ============================================================
-- (a) 更新された20行の確認：
--   select category, type, question, explanation from public.questions
--   where question in (
--     'ICD-10（国際疾病分類第10版）において、疾病分類コードの先頭文字が示すものはどれか。',
--     '次のうち、特定機能病院の承認要件として定められていないものはどれか。',
--     'AES（Advanced Encryption Standard）について正しい記述はどれか。',
--     'TCP/IPの4層モデルでHTTPSが動作する層はどれか。',
--     'リレーショナルデータベースにおいて、複数テーブルを結合するSQL句はどれか。',
--     '情報セキュリティの「CIA」が意味する3要素の組み合わせとして正しいものはどれか。',
--     'ディープラーニングにおいて、過学習を防ぐ手法として適切でないものはどれか。',
--     'SS-MIX2（Standardized Structured Medical record Information eXchange 2）の目的として最も適切なものはどれか。',
--     'SS-MIX2 はレセプト（診療報酬明細書）を電子請求するための仕組みである。',
--     'SOAP 形式の「O」は客観的情報（Objective：検査値・所見）を指す。',
--     '特定健康診査（特定健診）は、メタボリックシンドロームに着目した健診である。',
--     'データベースのトランザクションが満たすべき性質「ACID」に含まれないものはどれか。',
--     '公開鍵基盤（PKI）における認証局（CA）の役割はどれか。',
--     '個人情報保護法における「要配慮個人情報」に該当するものはどれか。',
--     'ファイアウォール', 'VPN', 'ハッシュ関数',
--     'SS-MIX2の標準化ストレージには、HL7 v2形式のデータがファイルとして格納される。',
--     'オンライン資格確認では、患者本人の同意があれば、他院で処方された薬剤情報や特定健診結果を医療機関が閲覧できる。',
--     'JLAC10'
--   )
--   order by category, type;
--
-- (b) 構造カラムが無傷であることの確認（実行前後で件数が一致すること）：
--   select type, category, count(*), count(answer) as answered_rows
--   from public.questions group by type, category order by type, category;
-- ============================================================

-- ============================================================
-- «ROLLBACK»  ← 追加した1文を取り除いて元に戻す
-- ============================================================
-- begin;
-- update public.questions set explanation = 'ICD-10のコードはアルファベット1文字＋数字2桁＋小数点以下の構成。先頭の英字は疾患の大分類（章）を示し、同じ系統・部位の疾患がまとめられている。'
--   where question = 'ICD-10（国際疾病分類第10版）において、疾病分類コードの先頭文字が示すものはどれか。';
-- update public.questions set explanation = '特定機能病院の承認要件（医療法）は「高度医療の提供・開発・評価」「400床以上」「16以上の診療科」「集中治療室など施設基準」など。救急医療の提供は要件に含まれていない。'
--   where question = '次のうち、特定機能病院の承認要件として定められていないものはどれか。';
-- update public.questions set explanation = 'AESはNISTが標準化した共通鍵ブロック暗号。ブロック長128ビット、鍵長は128/192/256ビットから選択可能。DESの後継として広く利用されている。'
--   where question = 'AES（Advanced Encryption Standard）について正しい記述はどれか。';
-- update public.questions set explanation = 'HTTPS（HTTP over TLS）はアプリケーション層プロトコル。TLSはトランスポート層の上で動作するセキュリティプロトコル。TCP/IPの4層ではアプリケーション層に位置する。'
--   where question = 'TCP/IPの4層モデルでHTTPSが動作する層はどれか。';
-- update public.questions set explanation = 'JOINはリレーショナルデータベースで複数テーブルを関連付けて結合する句。INNER JOIN・LEFT JOIN・RIGHT JOINなどの種類がある。GROUP BYは集計、ORDER BYは並び替えに使う。'
--   where question = 'リレーショナルデータベースにおいて、複数テーブルを結合するSQL句はどれか。';
-- update public.questions set explanation = 'CIAはConfidentiality（機密性）・Integrity（完全性）・Availability（可用性）の頭文字。ISO/IEC 27001など情報セキュリティ管理の基本概念として定義されている。'
--   where question = '情報セキュリティの「CIA」が意味する3要素の組み合わせとして正しいものはどれか。';
-- update public.questions set explanation = '過学習防止には Dropout・データ拡張・正則化・Early Stopping などが有効。学習率を大きくすると損失関数の収束が不安定になり、過学習の防止にはならない。'
--   where question = 'ディープラーニングにおいて、過学習を防ぐ手法として適切でないものはどれか。';
-- update public.questions set explanation = 'SS-MIX2は厚生労働省が推進する標準化ストレージ。HL7 v2.5メッセージをファイルとして保存し、異なる電子カルテ間での診療情報共有・地域医療連携に活用される。'
--   where question = 'SS-MIX2（Standardized Structured Medical record Information eXchange 2）の目的として最も適切なものはどれか。';
-- update public.questions set explanation = '誤り。SS-MIX2 は標準化ストレージで、HL7 v2.5 メッセージをファイル保存し医療機関間の診療情報共有に使う。レセプト請求はレセコン（ORCA 等）の役割。'
--   where question = 'SS-MIX2 はレセプト（診療報酬明細書）を電子請求するための仕組みである。';
-- update public.questions set explanation = '正しい。SOAP は Subjective（主観的情報）・Objective（客観的情報）・Assessment（評価）・Plan（計画）の頭文字。'
--   where question = 'SOAP 形式の「O」は客観的情報（Objective：検査値・所見）を指す。';
-- update public.questions set explanation = '正しい。特定健診は40〜74歳の医療保険加入者を対象に内臓脂肪症候群（メタボ）に着目して行われ、結果に応じて特定保健指導につなげる。'
--   where question = '特定健康診査（特定健診）は、メタボリックシンドロームに着目した健診である。';
-- update public.questions set explanation = 'ACIDは原子性・一貫性・分離性・持続性の頭字語。可用性はACIDには含まれず、分散システムのCAP定理などで扱う概念。'
--   where question = 'データベースのトランザクションが満たすべき性質「ACID」に含まれないものはどれか。';
-- update public.questions set explanation = '認証局（CA）は、公開鍵とその持ち主の対応を保証する電子証明書を発行し、失効管理を行う信頼の起点。'
--   where question = '公開鍵基盤（PKI）における認証局（CA）の役割はどれか。';
-- update public.questions set explanation = '要配慮個人情報は、人種・信条・社会的身分・病歴・犯罪歴など、取扱いに特に配慮を要する情報。取得には原則本人の同意が必要で、診療情報の多くが該当する。'
--   where question = '個人情報保護法における「要配慮個人情報」に該当するものはどれか。';
-- update public.questions set explanation = 'ネットワークの境界で通信を監視し、あらかじめ定めた規則に従って通過／遮断する仕組み。外部からの不正アクセスを防ぐ。'
--   where question = 'ファイアウォール';
-- update public.questions set explanation = 'インターネットなどの公衆網の上に、暗号化された仮想的な専用線を作る技術。拠点間接続やリモートアクセスで通信を保護する。'
--   where question = 'VPN';
-- update public.questions set explanation = '任意長のデータから固定長の値（ハッシュ値）を求める一方向の関数。同じ入力は常に同じ値になり、わずかな違いで値が大きく変わる。改ざん検知やパスワード保管に使う。'
--   where question = 'ハッシュ関数';
-- update public.questions set explanation = '正しい。SS-MIX2は患者基本情報・処方・検査結果などをHL7 v2.5メッセージにしてファイルで保管し、施設間共有や災害対策に活用する。'
--   where question = 'SS-MIX2の標準化ストレージには、HL7 v2形式のデータがファイルとして格納される。';
-- update public.questions set explanation = '正しい。オンライン資格確認等システムでは、患者の同意のもとで薬剤情報・特定健診情報・診療情報などを医療機関・薬局が閲覧でき、電子処方箋の基盤にもなっている。'
--   where question = 'オンライン資格確認では、患者本人の同意があれば、他院で処方された薬剤情報や特定健診結果を医療機関が閲覧できる。';
-- update public.questions set explanation = '日本臨床検査医学会が定める臨床検査項目分類コード。検査項目・材料・測定法などを体系的に表し、検査データの標準的な交換に用いる。'
--   where question = 'JLAC10';
-- commit;
