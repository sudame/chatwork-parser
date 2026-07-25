import { runCases } from "./helpers.ts";

runCases([
  {
    name: "インフォメーションをパースする",
    input: "[info]お知らせ本文[/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [{ type: "text", value: "お知らせ本文" }],
      },
    ],
  },
  {
    name: "空のインフォメーションをパースする",
    input: "[info][/info]",
    expected: [{ type: "info", title: null, children: [] }],
  },
  {
    name: "タイトル付きインフォメーションをパースする",
    input: "[info][title]重要[/title]本文[/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "text", value: "重要" }],
        children: [{ type: "text", value: "本文" }],
      },
    ],
  },
  {
    name: "空のタイトルは空配列になる",
    input: "[info][title][/title]本文[/info]",
    expected: [
      {
        type: "info",
        title: [],
        children: [{ type: "text", value: "本文" }],
      },
    ],
  },
  {
    name: "タイトル内のタグをパースする",
    input: "[info][title][To:123]連絡[/title]本文[/info]",
    expected: [
      {
        type: "info",
        title: [
          { type: "to", accountId: 123 },
          { type: "text", value: "連絡" },
        ],
        children: [{ type: "text", value: "本文" }],
      },
    ],
  },
  {
    name: "インフォメーション内の罫線でセクションを区切る",
    input: "[info][title]連絡[/title]1つ目[hr]2つ目[/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "text", value: "連絡" }],
        children: [
          { type: "text", value: "1つ目" },
          { type: "hr" },
          { type: "text", value: "2つ目" },
        ],
      },
    ],
  },
  {
    name: "インフォメーション内の引用をパースする",
    input: "[info][qt][qtmeta aid=1 time=100]引用[/qt][/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [
          {
            type: "quote",
            accountId: 1,
            time: 100,
            children: [{ type: "text", value: "引用" }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------ 入れ子のインフォメーション
  {
    name: "インフォメーションを入れ子にできる",
    input: "[info]外側[info]内側[/info][/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [
          { type: "text", value: "外側" },
          {
            type: "info",
            title: null,
            children: [{ type: "text", value: "内側" }],
          },
        ],
      },
    ],
  },
  {
    name: "入れ子のインフォメーションそれぞれのタイトルをパースする",
    input:
      "[info][title]外[/title]外本文[info][title]内[/title]内本文[/info][/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "text", value: "外" }],
        children: [
          { type: "text", value: "外本文" },
          {
            type: "info",
            title: [{ type: "text", value: "内" }],
            children: [{ type: "text", value: "内本文" }],
          },
        ],
      },
    ],
  },
  {
    name: "3 段に入れ子になったインフォメーションをパースする",
    input: "[info]1[info]2[info]3[/info][/info][/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [
          { type: "text", value: "1" },
          {
            type: "info",
            title: null,
            children: [
              { type: "text", value: "2" },
              {
                type: "info",
                title: null,
                children: [{ type: "text", value: "3" }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "入れ子のインフォメーションが先頭にあってもタイトルにはならない",
    input: "[info][info]内側[/info]外側の続き[/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [
          {
            type: "info",
            title: null,
            children: [{ type: "text", value: "内側" }],
          },
          { type: "text", value: "外側の続き" },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "余分なインフォメーションの閉じタグはテキストとして扱われる",
    input: "[info]hoge[/info][/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [{ type: "text", value: "hoge" }],
      },
      { type: "text", value: "[/info]" },
    ],
  },
  {
    name: "閉じられていないインフォメーションはテキストとして扱われる",
    input: "[info]閉じ忘れ",
    expected: [{ type: "text", value: "[info]閉じ忘れ" }],
  },
  {
    name: "対応する開始タグのないインフォメーションの閉じタグはテキストとして扱われる",
    input: "本文[/info]",
    expected: [{ type: "text", value: "本文[/info]" }],
  },
  {
    name: "入れ子の内側が閉じられていないインフォメーションは外側もテキストとして扱われる",
    input: "[info]外側[info]内側[/info]",
    expected: [
      { type: "text", value: "[info]外側" },
      {
        type: "info",
        title: null,
        children: [{ type: "text", value: "内側" }],
      },
    ],
  },
  {
    name: "インフォメーションの外のタイトルはテキストとして扱われる",
    input: "[title]タイトルだけ[/title]",
    expected: [{ type: "text", value: "[title]タイトルだけ[/title]" }],
  },
  {
    name: "閉じられていないタイトルはテキストとして扱われる",
    input: "[info][title]閉じ忘れ[/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [{ type: "text", value: "[title]閉じ忘れ" }],
      },
    ],
  },
  {
    name: "先頭にないタイトルはテキストとして扱われる",
    input: "[info]本文[title]後ろ[/title][/info]",
    expected: [
      {
        type: "info",
        title: null,
        children: [{ type: "text", value: "本文[title]後ろ[/title]" }],
      },
    ],
  },
  {
    name: "2 つ目のタイトルはテキストとして扱われる",
    input: "[info][title]1つ目[/title][title]2つ目[/title]本文[/info]",
    expected: [
      {
        type: "info",
        title: [{ type: "text", value: "1つ目" }],
        children: [{ type: "text", value: "[title]2つ目[/title]本文" }],
      },
    ],
  },
  {
    name: "インフォメーションと引用が交差する場合は内側だけが有効になる",
    input: "[info][qt]交差[/info][/qt]",
    expected: [
      { type: "text", value: "[info]" },
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [{ type: "text", value: "交差[/info]" }],
      },
    ],
  },
]);
