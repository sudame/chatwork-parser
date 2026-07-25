import { runCases } from "./helpers.ts";

runCases([
  {
    name: "空文字列は空配列になる",
    input: "",
    expected: [],
  },
  {
    name: "タグを含まない文字列は 1 つの text ノードになる",
    input: "こんにちは、世界",
    expected: [{ type: "text", value: "こんにちは、世界" }],
  },
  {
    name: "改行はテキストとして保持される",
    input: "1行目\n2行目\n\n4行目",
    expected: [{ type: "text", value: "1行目\n2行目\n\n4行目" }],
  },
  {
    name: "タグの前後の空白はテキストとして保持される",
    input: "  [hr]  ",
    expected: [
      { type: "text", value: "  " },
      { type: "hr" },
      { type: "text", value: "  " },
    ],
  },
  {
    name: "連続するテキストは 1 つの text ノードにまとめられる",
    input: "[hr]あ[unknown]い",
    expected: [{ type: "hr" }, { type: "text", value: "あ[unknown]い" }],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "タグではない角括弧はテキストとして扱われる",
    input: "配列は [1, 2, 3] のように書く",
    expected: [{ type: "text", value: "配列は [1, 2, 3] のように書く" }],
  },
  {
    name: "未知のタグはテキストとして扱われる",
    input: "[unknown:123]です",
    expected: [{ type: "text", value: "[unknown:123]です" }],
  },
  {
    name: "未知の閉じタグはテキストとして扱われる",
    input: "[unknown]本文[/unknown]",
    expected: [{ type: "text", value: "[unknown]本文[/unknown]" }],
  },
  {
    name: "空のブラケットはテキストとして扱われる",
    input: "[]と[ ]",
    expected: [{ type: "text", value: "[]と[ ]" }],
  },
  {
    name: "閉じられていないブラケットはテキストとして扱われる",
    input: "[To:123 が閉じていない",
    expected: [{ type: "text", value: "[To:123 が閉じていない" }],
  },
  {
    name: "ブラケットを跨ぐ改行はタグとして解釈されない",
    input: "[To:\n123]",
    expected: [{ type: "text", value: "[To:\n123]" }],
  },
]);
