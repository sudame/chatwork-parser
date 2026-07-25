import { runCases } from "./helpers.ts";

runCases([
  {
    name: "複数の記法を含むメッセージ全体をパースする",
    input:
      "[To:123]山田さん\n[info][title]週次報告[/title]進捗は順調です[hr]詳細: [url]https://example.com/report[/url][/info]\n[qt][qtmeta aid=456 time=1700000000]先週の共有です[/qt]\nよろしくお願いします。",
    expected: [
      { type: "to", accountId: 123 },
      { type: "text", value: "山田さん\n" },
      {
        type: "info",
        title: [{ type: "text", value: "週次報告" }],
        children: [
          { type: "text", value: "進捗は順調です" },
          { type: "hr" },
          { type: "text", value: "詳細: " },
          { type: "url", url: "https://example.com/report" },
        ],
      },
      { type: "text", value: "\n" },
      {
        type: "quote",
        accountId: 456,
        time: 1700000000,
        children: [{ type: "text", value: "先週の共有です" }],
      },
      { type: "text", value: "\nよろしくお願いします。" },
    ],
  },
  {
    name: "返信と引用を組み合わせたメッセージをパースする",
    input:
      "[rp aid=123 to=456-789][piconname:123]\n[qt][qtmeta aid=123 time=1700000000]元のメッセージ[/qt]\n承知しました。",
    expected: [
      { type: "reply", accountId: 123, roomId: 456, messageId: "789" },
      { type: "piconname", accountId: 123 },
      { type: "text", value: "\n" },
      {
        type: "quote",
        accountId: 123,
        time: 1700000000,
        children: [{ type: "text", value: "元のメッセージ" }],
      },
      { type: "text", value: "\n承知しました。" },
    ],
  },
  {
    name: "入れ子の引用とインフォメーションが混在するメッセージをパースする",
    input:
      "[qt][qtmeta aid=1 time=100][info][title]転送[/title][qt][qtmeta aid=2 time=200][To:3]確認[/qt][/info][/qt]",
    expected: [
      {
        type: "quote",
        accountId: 1,
        time: 100,
        children: [
          {
            type: "info",
            title: [{ type: "text", value: "転送" }],
            children: [
              {
                type: "quote",
                accountId: 2,
                time: 200,
                children: [
                  { type: "to", accountId: 3 },
                  { type: "text", value: "確認" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "壊れた記法が混ざっていても他の記法は正しくパースされる",
    input:
      "[To:123][To:]\n[info]本文[/info][/info]\n[url]https://example.com[/url][rp aid=456]",
    expected: [
      { type: "to", accountId: 123 },
      { type: "text", value: "[To:]\n" },
      {
        type: "info",
        title: null,
        children: [{ type: "text", value: "本文" }],
      },
      { type: "text", value: "[/info]\n" },
      { type: "url", url: "https://example.com" },
      { type: "text", value: "[rp aid=456]" },
    ],
  },
]);
