import { runCases } from "./helpers.ts";

runCases([
  {
    name: "罫線をパースする",
    input: "[hr]",
    expected: [{ type: "hr" }],
  },
  {
    name: "罫線の前後のテキストを分けてパースする",
    input: "上\n[hr]\n下",
    expected: [
      { type: "text", value: "上\n" },
      { type: "hr" },
      { type: "text", value: "\n下" },
    ],
  },
  {
    name: "連続した罫線をそれぞれパースする",
    input: "[hr][hr]",
    expected: [{ type: "hr" }, { type: "hr" }],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "属性付きの罫線はテキストとして扱われる",
    input: "[hr size=2]",
    expected: [{ type: "text", value: "[hr size=2]" }],
  },
  {
    name: "罫線の閉じタグはテキストとして扱われる",
    input: "[hr][/hr]",
    expected: [{ type: "hr" }, { type: "text", value: "[/hr]" }],
  },
  {
    name: "大文字の罫線はテキストとして扱われる",
    input: "[HR]",
    expected: [{ type: "text", value: "[HR]" }],
  },
]);
