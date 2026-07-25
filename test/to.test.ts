import { runCases } from "./helpers.ts";

runCases([
  {
    name: "To 記法をパースする",
    input: "[To:123]",
    expected: [{ type: "to", accountId: 123 }],
  },
  {
    name: "To 記法の後ろのテキストを分けてパースする",
    input: "[To:123] 山田さん\nお疲れさまです",
    expected: [
      { type: "to", accountId: 123 },
      { type: "text", value: " 山田さん\nお疲れさまです" },
    ],
  },
  {
    name: "複数の To 記法を並べてパースする",
    input: "[To:123]山田さん[To:456]鈴木さん",
    expected: [
      { type: "to", accountId: 123 },
      { type: "text", value: "山田さん" },
      { type: "to", accountId: 456 },
      { type: "text", value: "鈴木さん" },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "アカウント ID のない To 記法はテキストとして扱われる",
    input: "[To:]",
    expected: [{ type: "text", value: "[To:]" }],
  },
  {
    name: "アカウント ID が数値でない To 記法はテキストとして扱われる",
    input: "[To:abc]",
    expected: [{ type: "text", value: "[To:abc]" }],
  },
  {
    name: "コロンのない To 記法はテキストとして扱われる",
    input: "[To123]",
    expected: [{ type: "text", value: "[To123]" }],
  },
  {
    name: "大文字小文字が異なる To 記法はテキストとして扱われる",
    input: "[to:123]",
    expected: [{ type: "text", value: "[to:123]" }],
  },
  {
    name: "To 記法に閉じタグを書いてもテキストとして扱われる",
    input: "[To:123][/To]",
    expected: [
      { type: "to", accountId: 123 },
      { type: "text", value: "[/To]" },
    ],
  },
  {
    name: "アカウント ID に余分な文字が続く To 記法はテキストとして扱われる",
    input: "[To:123abc]",
    expected: [{ type: "text", value: "[To:123abc]" }],
  },
]);
