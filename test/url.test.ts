import { runCases } from "./helpers.ts";

runCases([
  {
    name: "URL 記法をパースする",
    input: "[url]https://example.com[/url]",
    expected: [{ type: "url", url: "https://example.com" }],
  },
  {
    name: "http の URL をパースする",
    input: "[url]http://example.com[/url]",
    expected: [{ type: "url", url: "http://example.com" }],
  },
  {
    name: "クエリや括弧を含む URL をパースする",
    input: "[url]https://example.com/path_(x)?a=1&b=2#frag[/url]",
    expected: [
      { type: "url", url: "https://example.com/path_(x)?a=1&b=2#frag" },
    ],
  },
  {
    name: "URL 記法の前後のテキストをパースする",
    input: "詳細は [url]http://example.com[/url] を参照",
    expected: [
      { type: "text", value: "詳細は " },
      { type: "url", url: "http://example.com" },
      { type: "text", value: " を参照" },
    ],
  },
  {
    name: "URL 記法の中身はタグとして解釈されない",
    input: "[url]https://example.com/?q=[To:123][/url]",
    expected: [{ type: "url", url: "https://example.com/?q=[To:123]" }],
  },

  // ------------------------------------------------------------ 壊れた記法
  {
    name: "閉じられていない URL 記法はテキストとして扱われる",
    input: "[url]https://example.com",
    expected: [{ type: "text", value: "[url]https://example.com" }],
  },
  {
    name: "対応する開始タグのない URL の閉じタグはテキストとして扱われる",
    input: "https://example.com[/url]",
    expected: [{ type: "text", value: "https://example.com[/url]" }],
  },
  {
    name: "中身が空の URL 記法はテキストとして扱われる",
    input: "[url][/url]",
    expected: [{ type: "text", value: "[url][/url]" }],
  },
  {
    name: "入れ子の URL 記法は最初の閉じタグまでを URL として扱う",
    input: "[url]https://a.example[url]https://b.example[/url]",
    expected: [
      { type: "url", url: "https://a.example[url]https://b.example" },
    ],
  },
  {
    name: "属性付きの URL 記法はテキストとして扱われる",
    input: "[url=https://example.com]リンク[/url]",
    expected: [
      { type: "text", value: "[url=https://example.com]リンク[/url]" },
    ],
  },
  {
    name: "余分な URL の閉じタグはテキストとして扱われる",
    input: "[url]https://example.com[/url][/url]",
    expected: [
      { type: "url", url: "https://example.com" },
      { type: "text", value: "[/url]" },
    ],
  },
]);
