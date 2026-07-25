import { runCases } from "./helpers.ts";

runCases([
  {
    name: "返信記法をパースする",
    input: "[rp aid=123 to=456-789]",
    expected: [
      { type: "reply", accountId: 123, roomId: 456, messageId: "789" },
    ],
  },
  {
    name: "返信記法と本文を組み合わせてパースする",
    input: "[rp aid=1234567 to=98765-1234567890123456789]了解です",
    expected: [
      {
        type: "reply",
        accountId: 1234567,
        roomId: 98765,
        messageId: "1234567890123456789",
      },
      { type: "text", value: "了解です" },
    ],
  },
  {
    name: "英数字混じりのメッセージ ID をパースする",
    input: "[rp aid=123 to=456-1a2b3c]",
    expected: [
      { type: "reply", accountId: 123, roomId: 456, messageId: "1a2b3c" },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "aid のない返信記法はテキストとして扱われる",
    input: "[rp to=456-789]",
    expected: [{ type: "text", value: "[rp to=456-789]" }],
  },
  {
    name: "to のない返信記法はテキストとして扱われる",
    input: "[rp aid=123]",
    expected: [{ type: "text", value: "[rp aid=123]" }],
  },
  {
    name: "aid が数値でない返信記法はテキストとして扱われる",
    input: "[rp aid=abc to=456-789]",
    expected: [{ type: "text", value: "[rp aid=abc to=456-789]" }],
  },
  {
    name: "メッセージ ID を欠く返信記法はテキストとして扱われる",
    input: "[rp aid=123 to=456]",
    expected: [{ type: "text", value: "[rp aid=123 to=456]" }],
  },
  {
    name: "ルーム ID が数値でない返信記法はテキストとして扱われる",
    input: "[rp aid=123 to=abc-789]",
    expected: [{ type: "text", value: "[rp aid=123 to=abc-789]" }],
  },
  {
    name: "属性のない返信記法はテキストとして扱われる",
    input: "[rp]",
    expected: [{ type: "text", value: "[rp]" }],
  },
  {
    name: "壊れた返信記法の周囲のテキストは通常どおりパースされる",
    input: "[rp aid=123]は無効\n[To:456]",
    expected: [
      { type: "text", value: "[rp aid=123]は無効\n" },
      { type: "to", accountId: 456 },
    ],
  },
]);
