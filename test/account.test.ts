import { runCases } from "./helpers.ts";

runCases([
  {
    name: "プロフィールアイコンをパースする",
    input: "[picon:123]",
    expected: [{ type: "picon", accountId: 123 }],
  },
  {
    name: "アカウント名をパースする",
    input: "[pname:123]",
    expected: [{ type: "pname", accountId: 123 }],
  },
  {
    name: "アイコン＋名前をパースする",
    input: "[piconname:123]",
    expected: [{ type: "piconname", accountId: 123 }],
  },
  {
    name: "アカウント表示系をテキストと混在させてパースする",
    input: "[picon:123]さん、[pname:456]さんへ",
    expected: [
      { type: "picon", accountId: 123 },
      { type: "text", value: "さん、" },
      { type: "pname", accountId: 456 },
      { type: "text", value: "さんへ" },
    ],
  },
  {
    name: "インフォメーション内のアカウント表示をパースする",
    input: "[info][piconname:123] が対応します[/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [
          { type: "piconname", accountId: 123 },
          { type: "text", value: " が対応します" },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "アカウント ID のないプロフィールアイコンはテキストとして扱われる",
    input: "[picon:]",
    expected: [{ type: "text", value: "[picon:]" }],
  },
  {
    name: "アカウント ID が数値でないアカウント名はテキストとして扱われる",
    input: "[pname:abc]",
    expected: [{ type: "text", value: "[pname:abc]" }],
  },
  {
    name: "コロンのないアイコン＋名前はテキストとして扱われる",
    input: "[piconname]",
    expected: [{ type: "text", value: "[piconname]" }],
  },
  {
    name: "閉じられていないプロフィールアイコンはテキストとして扱われる",
    input: "[picon:123",
    expected: [{ type: "text", value: "[picon:123" }],
  },
  {
    name: "アカウント表示系の閉じタグはテキストとして扱われる",
    input: "[pname:123][/pname]",
    expected: [
      { type: "pname", accountId: 123 },
      { type: "text", value: "[/pname]" },
    ],
  },
  {
    name: "アカウント ID に空白を含むアカウント名はテキストとして扱われる",
    input: "[pname: 123]",
    expected: [{ type: "text", value: "[pname: 123]" }],
  },
]);
