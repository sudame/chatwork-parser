import { runCases } from "./helpers.ts";

runCases([
  {
    name: "未完了のタスクをパースする",
    input: "[task aid=6078148 st=open lt=1784955600 ltype=time]test[/task]",
    expected: [
      {
        type: "task",
        accountIds: [6078148],
        status: "open",
        limitTime: 1784955600,
        limitType: "time",
        children: [{ type: "text", value: "test" }],
      },
    ],
  },
  {
    name: "完了したタスクをパースする",
    input: "[task aid=6078148 st=done lt=1784955600 ltype=time]test[/task]",
    expected: [
      {
        type: "task",
        accountIds: [6078148],
        status: "done",
        limitTime: 1784955600,
        limitType: "time",
        children: [{ type: "text", value: "test" }],
      },
    ],
  },
  {
    name: "複数の担当者を持つタスクをパースする",
    input:
      "[task aid=6078148,8269766,8306972 st=open lt=1784954498 ltype=date]test[/task]",
    expected: [
      {
        type: "task",
        accountIds: [6078148, 8269766, 8306972],
        status: "open",
        limitTime: 1784954498,
        limitType: "date",
        children: [{ type: "text", value: "test" }],
      },
    ],
  },
  {
    name: "期限のないタスクは limitTime と limitType が null になる",
    input: "[task aid=6078148 st=open]test[/task]",
    expected: [
      {
        type: "task",
        accountIds: [6078148],
        status: "open",
        limitTime: null,
        limitType: null,
        children: [{ type: "text", value: "test" }],
      },
    ],
  },
  {
    name: "本文が空のタスクをパースする",
    input: "[task aid=6078148 st=open][/task]",
    expected: [
      {
        type: "task",
        accountIds: [6078148],
        status: "open",
        limitTime: null,
        limitType: null,
        children: [],
      },
    ],
  },
  {
    name: "本文にタグを含むタスクをパースする",
    input:
      "[task aid=6078148 st=open lt=1784955600 ltype=time][To:123]確認\n[url]https://example.com[/url][/task]",
    expected: [
      {
        type: "task",
        accountIds: [6078148],
        status: "open",
        limitTime: 1784955600,
        limitType: "time",
        children: [
          { type: "to", accountId: 123 },
          { type: "text", value: "確認\n" },
          { type: "url", url: "https://example.com" },
        ],
      },
    ],
  },
  {
    name: "タスクの前後のテキストをパースする",
    input: "前[task aid=1 st=open]本文[/task]後",
    expected: [
      { type: "text", value: "前" },
      {
        type: "task",
        accountIds: [1],
        status: "open",
        limitTime: null,
        limitType: null,
        children: [{ type: "text", value: "本文" }],
      },
      { type: "text", value: "後" },
    ],
  },

  // ---------------------------------------------- タスク追加・完了メッセージ
  {
    name: "タスク作成のメッセージ全体をパースする",
    input:
      "[info][title][dtext:task_added][/title][task aid=6078148 st=open lt=1784955600 ltype=time]test[/task][/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "dtext", key: "task_added" }],
        children: [
          {
            type: "task",
            accountIds: [6078148],
            status: "open",
            limitTime: 1784955600,
            limitType: "time",
            children: [{ type: "text", value: "test" }],
          },
        ],
      },
    ],
  },
  {
    name: "タスク完了のメッセージ全体をパースする",
    input:
      "[info][title][dtext:task_done][/title][task aid=6078148 st=done lt=1784955600 ltype=time]test[/task][/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "dtext", key: "task_done" }],
        children: [
          {
            type: "task",
            accountIds: [6078148],
            status: "done",
            limitTime: 1784955600,
            limitType: "time",
            children: [{ type: "text", value: "test" }],
          },
        ],
      },
    ],
  },
  {
    name: "複数ユーザーへのタスク作成のメッセージ全体をパースする",
    input:
      "[info][title][dtext:task_added][/title][task aid=6078148,8269766,8306972 st=open lt=1784954498 ltype=date]test[/task][/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "dtext", key: "task_added" }],
        children: [
          {
            type: "task",
            accountIds: [6078148, 8269766, 8306972],
            status: "open",
            limitTime: 1784954498,
            limitType: "date",
            children: [{ type: "text", value: "test" }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "属性のないタスクはテキストとして扱われる",
    input: "[task]本文[/task]",
    expected: [{ type: "text", value: "[task]本文[/task]" }],
  },
  {
    name: "aid のないタスクはテキストとして扱われる",
    input: "[task st=open]本文[/task]",
    expected: [{ type: "text", value: "[task st=open]本文[/task]" }],
  },
  {
    name: "st のないタスクはテキストとして扱われる",
    input: "[task aid=1]本文[/task]",
    expected: [{ type: "text", value: "[task aid=1]本文[/task]" }],
  },
  {
    name: "st が open でも done でもないタスクはテキストとして扱われる",
    input: "[task aid=1 st=closed]本文[/task]",
    expected: [{ type: "text", value: "[task aid=1 st=closed]本文[/task]" }],
  },
  {
    name: "aid が数値でないタスクはテキストとして扱われる",
    input: "[task aid=abc st=open]本文[/task]",
    expected: [{ type: "text", value: "[task aid=abc st=open]本文[/task]" }],
  },
  {
    name: "aid の区切りが余分なタスクはテキストとして扱われる",
    input: "[task aid=1,,2 st=open]本文[/task]",
    expected: [{ type: "text", value: "[task aid=1,,2 st=open]本文[/task]" }],
  },
  {
    name: "lt だけを持つタスクはテキストとして扱われる",
    input: "[task aid=1 st=open lt=1784955600]本文[/task]",
    expected: [
      { type: "text", value: "[task aid=1 st=open lt=1784955600]本文[/task]" },
    ],
  },
  {
    name: "ltype だけを持つタスクはテキストとして扱われる",
    input: "[task aid=1 st=open ltype=time]本文[/task]",
    expected: [
      { type: "text", value: "[task aid=1 st=open ltype=time]本文[/task]" },
    ],
  },
  {
    name: "ltype が time でも date でもないタスクはテキストとして扱われる",
    input: "[task aid=1 st=open lt=1784955600 ltype=week]本文[/task]",
    expected: [
      {
        type: "text",
        value: "[task aid=1 st=open lt=1784955600 ltype=week]本文[/task]",
      },
    ],
  },
  {
    name: "lt が数値でないタスクはテキストとして扱われる",
    input: "[task aid=1 st=open lt=abc ltype=time]本文[/task]",
    expected: [
      { type: "text", value: "[task aid=1 st=open lt=abc ltype=time]本文[/task]" },
    ],
  },
  {
    name: "属性の順序が異なるタスクはテキストとして扱われる",
    input: "[task st=open aid=1]本文[/task]",
    expected: [{ type: "text", value: "[task st=open aid=1]本文[/task]" }],
  },
  {
    name: "閉じられていないタスクはテキストとして扱われる",
    input: "[task aid=1 st=open]閉じ忘れ",
    expected: [{ type: "text", value: "[task aid=1 st=open]閉じ忘れ" }],
  },
  {
    name: "対応する開始タグのないタスクの閉じタグはテキストとして扱われる",
    input: "本文[/task]",
    expected: [{ type: "text", value: "本文[/task]" }],
  },
  {
    name: "余分なタスクの閉じタグはテキストとして扱われる",
    input: "[task aid=1 st=open]本文[/task][/task]",
    expected: [
      {
        type: "task",
        accountIds: [1],
        status: "open",
        limitTime: null,
        limitType: null,
        children: [{ type: "text", value: "本文" }],
      },
      { type: "text", value: "[/task]" },
    ],
  },
  {
    name: "壊れたタスクを含むインフォメーションは本文がテキストになる",
    input: "[info][title][dtext:task_added][/title][task aid=1]test[/task][/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "dtext", key: "task_added" }],
        children: [{ type: "text", value: "[task aid=1]test[/task]" }],
      },
    ],
  },
]);
