# @sudame/chatwork-parser

Chatwork のメッセージ記法を解析して JSON (AST) に変換する TypeScript 製パーサー。

依存パッケージはゼロ。パーサーコンビネーターも含めて自前で持っています。

## 使い方

npm には未公開です。ローカルパスか git URL で依存に追加してください。

```ts
import { parse } from "@sudame/chatwork-parser";

const nodes = parse("[To:1234567] 山田さん\n[info][title]週次報告[/title]進捗は順調です[/info]");
```

```json
[
  { "type": "to", "accountId": 1234567 },
  { "type": "text", "value": " 山田さん\n" },
  {
    "type": "info",
    "title": [{ "type": "text", "value": "週次報告" }],
    "children": [{ "type": "text", "value": "進捗は順調です" }]
  }
]
```

## API

### `parse(source: string): ChatworkNode[]`

メッセージ本文を受け取り、ノードの配列を返します。入力がどんな文字列でも例外は
投げません（記法として解釈できない部分はテキストになります）。

型は `ChatworkNode` の判別可能ユニオンとして公開しているので、`type` で分岐すれば
中身が絞り込まれます。

```ts
import { parse, type ChatworkNode } from "@sudame/chatwork-parser";

function toPlainText(nodes: ChatworkNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
          return node.value;
        case "quote":
        case "info":
        case "task":
          return toPlainText(node.children);
        case "url":
          return node.url;
        default:
          return "";
      }
    })
    .join("");
}
```

## 対応している記法

公式ドキュメント（[メッセージ記法](https://developer.chatwork.com/docs/message-notation)）に
記載のある記法に加えて、タスクの追加・完了メッセージで使われる `[task]` と
`[dtext:]` に対応しています。

| 記法 | ノード |
| --- | --- |
| （素のテキスト） | `{ type: "text", value }` |
| `[To:{account_id}]` | `{ type: "to", accountId }` |
| `[rp aid={account_id} to={room_id}-{message_id}]` | `{ type: "reply", accountId, roomId, messageId }` |
| `[qt][qtmeta aid={account_id} time={timestamp}]...[/qt]` | `{ type: "quote", accountId, time, children }` |
| `[info]...[/info]`<br>`[info][title]...[/title]...[/info]` | `{ type: "info", title, children }` |
| `[hr]` | `{ type: "hr" }` |
| `[picon:{account_id}]` | `{ type: "picon", accountId }` |
| `[pname:{account_id}]` | `{ type: "pname", accountId }` |
| `[piconname:{account_id}]` | `{ type: "piconname", accountId }` |
| `[url]http://...[/url]` | `{ type: "url", url }` |
| `[dtext:{key}]` | `{ type: "dtext", key }` |
| `[task aid=... st=... lt=... ltype=...]...[/task]` | `{ type: "task", accountIds, status, limitTime, limitType, children }` |

補足:

- `messageId` だけ文字列です。メッセージ ID は桁が大きく、安全に数値へ変換できない
  ためです。`accountId` / `roomId` / `time` は数値になります。
- `[qtmeta]` のない引用は `accountId` と `time` が `null`、`[title]` のない
  インフォメーションは `title` が `null` になります（キー自体は必ず存在します）。
- `[task]` の `aid` はカンマ区切りで複数の担当者を持てるため、常に配列です。
  期限のないタスクは `limitTime` と `limitType` がどちらも `null` になります。

### タスクのメッセージ

タスクの追加・完了は、`[info]` と `[task]` の組み合わせで表現されます。

```
[info][title][dtext:task_added][/title][task aid=6078148 st=open lt=1784955600 ltype=time]資料を確認する[/task][/info]
```

```json
[
  {
    "type": "info",
    "title": [{ "type": "dtext", "key": "task_added" }],
    "children": [
      {
        "type": "task",
        "accountIds": [6078148],
        "status": "open",
        "limitTime": 1784955600,
        "limitType": "time",
        "children": [{ "type": "text", "value": "資料を確認する" }]
      }
    ]
  }
]
```

## 壊れた記法の扱い

閉じ忘れ、属性の不足、未知のタグなどは**エラーにせず、元の文字列のまま `text`
ノードとして出力**します。人間が手で書いたメッセージには成立していない記法が
そのまま含まれうるためです。

```ts
parse("[info]hoge[/info][/info]");
// [
//   { type: "info", title: null, children: [{ type: "text", value: "hoge" }] },
//   { type: "text", value: "[/info]" },
// ]
```

判定のルール:

1. タグ名の大文字小文字は区別します（`[To:]` のみ大文字、他は小文字）。
2. 属性や値の形式が仕様と違うタグは、記法として成立させません。
   例えば `[task aid=1 st=closed]` の `st` は `open` / `done` のみ受け付けます。
3. 閉じタグは対応する開始タグとだけ結びつきます。余った開始タグ・閉じタグは
   テキストになります。`[info][qt]交差[/info][/qt]` のように交差した場合は、
   内側の `[qt]` だけが記法として成立します。
4. `[title]` は `[info]` の直後、`[qtmeta]` は `[qt]` の直後にある場合のみ有効です。
5. `[url]` の中身はタグとして解釈せず、最初の `[/url]` までをそのまま URL とします。

## 開発

Node.js 22.18 以降が必要です（TypeScript を変換なしで実行するため）。

```sh
npm install
npm test          # node:test によるテスト
npm run typecheck # tsc --noEmit
npm run check     # Biome (整形 + lint + import 整列) のチェック
npm run fix       # Biome で自動修正
```

### 構成

| パス | 役割 |
| --- | --- |
| `src/combinator.ts` | 最小限のパーサーコンビネーター |
| `src/parse.ts` | Chatwork 記法のパーサー定義 |
| `src/types.ts` | 出力する AST の型 |
| `test/` | 記法のドメインごとに分けたテスト |

パーサーは PEG 方式で、失敗しても位置を進めずバックトラックします。記法として
成立しなかった箇所は `[` を 1 文字ずつテキストとして読み直すため、壊れた記法の
扱いが特別な復旧処理なしに決まります。

記法ごとの定義は、そのまま記法の形をなぞる形で書けます。

```ts
const info = str("[info]")
  .next(seq(optional(title), contentUntil("[/info]")))
  .skip(str("[/info]"))
  .map(([titleNodes, children]) => ({ type: "info", title: titleNodes, children }));
```

テストは「入力の文字列」と「期待する JSON」の表を並べ、`parse()` の結果と
突き合わせる形式です。各ドメインに正常系と壊れた記法のケースを置いています。

### エディタ

Helix 向けのプロジェクトローカル設定を `.helix/languages.toml` に置いています。
補完と型チェックは typescript-language-server、整形と lint 診断は Biome の
`lsp-proxy` が担当し、保存時に自動整形されます。どちらも devDependencies に
入っているので `npm install` だけで動きます（リポジトリのルートで `hx` を
起動してください）。

## ライセンス

MIT
