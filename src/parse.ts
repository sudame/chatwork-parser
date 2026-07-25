import {
  alt,
  eof,
  lazy,
  notFollowedBy,
  optional,
  type Parser,
  regex,
  seq,
  str,
} from "./combinator.ts";
import type { ChatworkNode, TextNode } from "./types.ts";

/**
 * 記法として解釈できない部分は `[` 単体などの細かい text ノードになるため、
 * 隣り合う text ノードを 1 つにまとめる。
 */
function mergeText(nodes: ChatworkNode[]): ChatworkNode[] {
  const merged: ChatworkNode[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") {
      last.value += node.value;
      continue;
    }
    merged.push(node);
  }
  return merged;
}

const text = (value: string): TextNode => ({ type: "text", value });

const digits = regex(/\d+/).map(Number);

/** 決まった文字列を、その文字列そのものを型として持つ値にする。 */
const literal = <T extends string>(value: T): Parser<T> =>
  str(value).map((): T => value);

// ---------------------------------------------------------------- 単独のタグ

/** `[To:{account_id}]` */
const to = str("[To:")
  .next(digits)
  .skip(str("]"))
  .map((accountId): ChatworkNode => ({ type: "to", accountId }));

/** `[rp aid={account_id} to={room_id}-{message_id}]` */
const reply = str("[rp aid=")
  .next(
    seq(digits, str(" to=").next(digits), str("-").next(regex(/[0-9A-Za-z]+/))),
  )
  .skip(str("]"))
  .map(
    ([accountId, roomId, messageId]): ChatworkNode => ({
      type: "reply",
      accountId,
      roomId,
      messageId,
    }),
  );

/** `[hr]` */
const hr = str("[hr]").map((): ChatworkNode => ({ type: "hr" }));

/** `[picon:{id}]` / `[pname:{id}]` / `[piconname:{id}]` */
const account = (type: "picon" | "pname" | "piconname"): Parser<ChatworkNode> =>
  str(`[${type}:`)
    .next(digits)
    .skip(str("]"))
    .map((accountId): ChatworkNode => ({ type, accountId }));

/** `[dtext:{key}]` */
const dtext = str("[dtext:")
  .next(regex(/[0-9A-Za-z_]+/))
  .skip(str("]"))
  .map((key): ChatworkNode => ({ type: "dtext", key }));

/**
 * `[url]http://...[/url]`
 *
 * 中身はタグとして解釈せず、最初の `[/url]` までをそのまま URL として扱う。
 */
const url = str("[url]")
  .next(regex(/(?:(?!\[\/url\])[\s\S])+/))
  .skip(str("[/url]"))
  .map((value): ChatworkNode => ({ type: "url", url: value }));

// ---------------------------------------------------------- 入れ子になるタグ

/**
 * 閉じタグまでの本文。
 *
 * `close` に到達すると本文の解析を打ち切る。`close` が null の場合は閉じタグを
 * 持たない最上位（メッセージ全体）を表す。
 */
const contentUntil = (close: string | null): Parser<ChatworkNode[]> =>
  lazy(() => {
    /** タグの開始になり得ない文字の並び。 */
    const plain = regex(/[^[]+/).map(text);
    /** タグとして解釈できなかった `[`。閉じタグの `[` は本文に含めない。 */
    const openBracket = str("[").map(text);
    const bracket =
      close === null
        ? openBracket
        : notFollowedBy(str(close)).next(openBracket);

    return alt<ChatworkNode>(node, plain, bracket).many().map(mergeText);
  });

/** `[qtmeta aid={account_id} time={timestamp}]` */
const qtmeta = str("[qtmeta aid=")
  .next(seq(digits, str(" time=").next(digits)))
  .skip(str("]"));

/** `[qt][qtmeta ...]...[/qt]` — `[qtmeta]` は `[qt]` の直後にある場合のみ有効。 */
const quote = str("[qt]")
  .next(seq(optional(qtmeta), contentUntil("[/qt]")))
  .skip(str("[/qt]"))
  .map(
    ([meta, children]): ChatworkNode => ({
      type: "quote",
      accountId: meta?.[0] ?? null,
      time: meta?.[1] ?? null,
      children,
    }),
  );

/** `aid` はカンマ区切りで複数のアカウント ID を持てる。 */
const accountIdList = regex(/\d+(?:,\d+)*/).map((value) =>
  value.split(",").map(Number),
);

const taskStatus = alt(literal("open"), literal("done"));

/** `lt` と `ltype` は対で指定される。期限のないタスクではどちらも現れない。 */
const taskLimit = seq(
  str(" lt=").next(digits),
  str(" ltype=").next(alt(literal("time"), literal("date"))),
);

const taskHeader = str("[task aid=")
  .next(seq(accountIdList, str(" st=").next(taskStatus), optional(taskLimit)))
  .skip(str("]"));

/** `[task aid=... st=... lt=... ltype=...]...[/task]` */
const task = seq(taskHeader, contentUntil("[/task]"))
  .skip(str("[/task]"))
  .map(
    ([[accountIds, status, limit], children]): ChatworkNode => ({
      type: "task",
      accountIds,
      status,
      limitTime: limit?.[0] ?? null,
      limitType: limit?.[1] ?? null,
      children,
    }),
  );

/** `[title]...[/title]` — `[info]` の直後にある場合のみ有効。 */
const title = str("[title]")
  .next(contentUntil("[/title]"))
  .skip(str("[/title]"));

/** `[info]([title]...[/title])...[/info]` */
const info = str("[info]")
  .next(seq(optional(title), contentUntil("[/info]")))
  .skip(str("[/info]"))
  .map(
    ([titleNodes, children]): ChatworkNode => ({
      type: "info",
      title: titleNodes,
      children,
    }),
  );

/**
 * いずれかの記法。
 *
 * 途中で失敗した記法はバックトラックして未消費に戻るため、閉じ忘れなどの壊れた
 * 記法は最終的に `[` から順にテキストとして読み直される。
 */
const node: Parser<ChatworkNode> = lazy(() =>
  alt<ChatworkNode>(
    quote,
    info,
    task,
    hr,
    to,
    reply,
    account("picon"),
    account("pname"),
    account("piconname"),
    dtext,
    url,
  ),
);

const document = contentUntil(null).skip(eof);

/**
 * Chatwork のメッセージ本文をパースして AST を返す。
 *
 * 記法として解釈できなかった部分は、元の文字列のまま text ノードとして出力する。
 */
export function parse(source: string): ChatworkNode[] {
  const result = document.run(source, 0);
  if (!result.ok) {
    // 任意の文字はテキストとして読めるため、ここには到達しない。
    throw new Error("failed to parse the message");
  }
  return result.value;
}
