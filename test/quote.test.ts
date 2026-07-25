import { runCases } from "./helpers.ts";

runCases([
  {
    name: "qtmeta 付きの引用をパースする",
    input: "[qt][qtmeta aid=123 time=1234567890]引用文[/qt]",
    expected: [
      {
        type: "quote",
        accountId: 123,
        time: 1234567890,
        children: [{ type: "text", value: "引用文" }],
      },
    ],
  },
  {
    name: "qtmeta のない引用は accountId と time が null になる",
    input: "[qt]引用文[/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [{ type: "text", value: "引用文" }],
      },
    ],
  },
  {
    name: "空の引用をパースする",
    input: "[qt][/qt]",
    expected: [{ type: "quote", accountId: null, time: null, children: [] }],
  },
  {
    name: "引用の中のタグをパースする",
    input: "[qt][qtmeta aid=123 time=1234567890][To:456]確認お願いします[/qt]",
    expected: [
      {
        type: "quote",
        accountId: 123,
        time: 1234567890,
        children: [
          { type: "to", accountId: 456 },
          { type: "text", value: "確認お願いします" },
        ],
      },
    ],
  },
  {
    name: "引用の前後のテキストをパースする",
    input: "前文\n[qt][qtmeta aid=123 time=1234567890]引用[/qt]\n後文",
    expected: [
      { type: "text", value: "前文\n" },
      {
        type: "quote",
        accountId: 123,
        time: 1234567890,
        children: [{ type: "text", value: "引用" }],
      },
      { type: "text", value: "\n後文" },
    ],
  },
  {
    name: "並列した引用をそれぞれパースする",
    input:
      "[qt][qtmeta aid=1 time=100]1つ目[/qt][qt][qtmeta aid=2 time=200]2つ目[/qt]",
    expected: [
      {
        type: "quote",
        accountId: 1,
        time: 100,
        children: [{ type: "text", value: "1つ目" }],
      },
      {
        type: "quote",
        accountId: 2,
        time: 200,
        children: [{ type: "text", value: "2つ目" }],
      },
    ],
  },

  // ------------------------------------------------------------ 入れ子の引用
  {
    name: "入れ子になった引用をパースする",
    input:
      "[qt][qtmeta aid=1 time=100]外側[qt][qtmeta aid=2 time=200]内側[/qt][/qt]",
    expected: [
      {
        type: "quote",
        accountId: 1,
        time: 100,
        children: [
          { type: "text", value: "外側" },
          {
            type: "quote",
            accountId: 2,
            time: 200,
            children: [{ type: "text", value: "内側" }],
          },
        ],
      },
    ],
  },
  {
    name: "3 段に入れ子になった引用をパースする",
    input: "[qt]1[qt]2[qt]3[/qt][/qt][/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [
          { type: "text", value: "1" },
          {
            type: "quote",
            accountId: null,
            time: null,
            children: [
              { type: "text", value: "2" },
              {
                type: "quote",
                accountId: null,
                time: null,
                children: [{ type: "text", value: "3" }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "入れ子の引用の後ろに続く要素をパースする",
    input: "[qt][qt]内側[/qt]外側の続き[/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [
          {
            type: "quote",
            accountId: null,
            time: null,
            children: [{ type: "text", value: "内側" }],
          },
          { type: "text", value: "外側の続き" },
        ],
      },
    ],
  },
  {
    name: "引用の中のインフォメーションをパースする",
    input:
      "[qt][qtmeta aid=1 time=100][info][title]件名[/title]本文[/info][/qt]",
    expected: [
      {
        type: "quote",
        accountId: 1,
        time: 100,
        children: [
          {
            type: "info",
            title: [{ type: "text", value: "件名" }],
            children: [{ type: "text", value: "本文" }],
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "閉じられていない引用はテキストとして扱われる",
    input: "[qt]閉じ忘れ",
    expected: [{ type: "text", value: "[qt]閉じ忘れ" }],
  },
  {
    name: "余分な引用の閉じタグはテキストとして扱われる",
    input: "[qt]本文[/qt][/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [{ type: "text", value: "本文" }],
      },
      { type: "text", value: "[/qt]" },
    ],
  },
  {
    name: "対応する開始タグのない引用の閉じタグはテキストとして扱われる",
    input: "本文[/qt]",
    expected: [{ type: "text", value: "本文[/qt]" }],
  },
  {
    name: "入れ子の内側が閉じられていない引用は外側もテキストとして扱われる",
    input: "[qt]外側[qt]内側[/qt]",
    expected: [
      { type: "text", value: "[qt]外側" },
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [{ type: "text", value: "内側" }],
      },
    ],
  },
  {
    name: "引用の外にある qtmeta はテキストとして扱われる",
    input: "[qtmeta aid=123 time=1234567890]",
    expected: [{ type: "text", value: "[qtmeta aid=123 time=1234567890]" }],
  },
  {
    name: "引用の先頭にない qtmeta はテキストとして扱われる",
    input: "[qt]本文[qtmeta aid=123 time=1234567890][/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [
          { type: "text", value: "本文[qtmeta aid=123 time=1234567890]" },
        ],
      },
    ],
  },
  {
    name: "属性の欠けた qtmeta はテキストとして扱われる",
    input: "[qt][qtmeta aid=123]本文[/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [{ type: "text", value: "[qtmeta aid=123]本文" }],
      },
    ],
  },
  {
    name: "time が数値でない qtmeta はテキストとして扱われる",
    input: "[qt][qtmeta aid=123 time=abc]本文[/qt]",
    expected: [
      {
        type: "quote",
        accountId: null,
        time: null,
        children: [{ type: "text", value: "[qtmeta aid=123 time=abc]本文" }],
      },
    ],
  },
]);
