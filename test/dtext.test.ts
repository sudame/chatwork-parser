import { runCases } from "./helpers.ts";

runCases([
  {
    name: "dtext をパースする",
    input: "[dtext:task_added]",
    expected: [{ type: "dtext", key: "task_added" }],
  },
  {
    name: "タスク完了の dtext をパースする",
    input: "[dtext:task_done]",
    expected: [{ type: "dtext", key: "task_done" }],
  },
  {
    name: "タイトル内の dtext をパースする",
    input: "[info][title][dtext:task_added][/title]本文[/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "dtext", key: "task_added" }],
        children: [{ type: "text", value: "本文" }],
      },
    ],
  },
  {
    name: "dtext の前後のテキストを分けてパースする",
    input: "前[dtext:task_added]後",
    expected: [
      { type: "text", value: "前" },
      { type: "dtext", key: "task_added" },
      { type: "text", value: "後" },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "キーのない dtext はテキストとして扱われる",
    input: "[dtext:]",
    expected: [{ type: "text", value: "[dtext:]" }],
  },
  {
    name: "コロンのない dtext はテキストとして扱われる",
    input: "[dtext]",
    expected: [{ type: "text", value: "[dtext]" }],
  },
  {
    name: "キーに空白を含む dtext はテキストとして扱われる",
    input: "[dtext:task added]",
    expected: [{ type: "text", value: "[dtext:task added]" }],
  },
  {
    name: "閉じられていない dtext はテキストとして扱われる",
    input: "[dtext:task_added",
    expected: [{ type: "text", value: "[dtext:task_added" }],
  },
  {
    name: "大文字の dtext はテキストとして扱われる",
    input: "[DTEXT:task_added]",
    expected: [{ type: "text", value: "[DTEXT:task_added]" }],
  },
  {
    name: "dtext の閉じタグはテキストとして扱われる",
    input: "[dtext:task_added][/dtext]",
    expected: [
      { type: "dtext", key: "task_added" },
      { type: "text", value: "[/dtext]" },
    ],
  },
]);
