import type { ChatworkNode } from "./types.ts";

/** `[qt]` / `[info]` / `[title]` のように開始タグと閉じタグを持つ記法の解析途中の状態。 */
type Frame = {
  tag: "qt" | "info" | "title";
  /** 開始タグの文字列。閉じられなかった場合にテキストへ戻すために保持する。 */
  raw: string;
  nodes: ChatworkNode[];
  /** `[qt]` 用。`[qtmeta]` から取り出した値。 */
  accountId: number | null;
  time: number | null;
  metaConsumed: boolean;
  /** `[info]` 用。`[title]` から取り出した値。 */
  title: ChatworkNode[] | null;
};

const TO_PATTERN = /^To:(\d+)$/;
const REPLY_PATTERN = /^rp aid=(\d+) to=(\d+)-([0-9A-Za-z]+)$/;
const QTMETA_PATTERN = /^qtmeta aid=(\d+) time=(\d+)$/;
const ACCOUNT_PATTERN = /^(picon|pname|piconname):(\d+)$/;

const URL_CLOSE = "[/url]";

/**
 * `source[start]` から始まるタグを読み取る。
 * `]` に到達する前に `[` か改行が現れた場合はタグとして扱わない。
 */
function readTag(
  source: string,
  start: number,
): { inner: string; raw: string } | null {
  for (let i = start + 1; i < source.length; i++) {
    const char = source[i];
    if (char === "]") {
      return {
        inner: source.slice(start + 1, i),
        raw: source.slice(start, i + 1),
      };
    }
    if (char === "[" || char === "\n") return null;
  }
  return null;
}

/**
 * Chatwork のメッセージ本文をパースして AST を返す。
 *
 * 記法として解釈できなかった部分は、元の文字列のまま text ノードとして出力する。
 */
export function parse(source: string): ChatworkNode[] {
  const root: ChatworkNode[] = [];
  const stack: Frame[] = [];

  const top = (): Frame | undefined => stack[stack.length - 1];
  const target = (): ChatworkNode[] => top()?.nodes ?? root;

  const pushText = (value: string): void => {
    if (value === "") return;
    const nodes = target();
    const last = nodes[nodes.length - 1];
    if (last?.type === "text") last.value += value;
    else nodes.push({ type: "text", value });
  };

  const pushNode = (node: ChatworkNode): void => {
    target().push(node);
  };

  /** 閉じられなかったフレームを開始タグのテキストと子ノードに戻し、親へ移す。 */
  const unwind = (): void => {
    const frame = stack.pop();
    if (frame === undefined) return;
    pushText(frame.raw);
    for (const node of frame.nodes) {
      if (node.type === "text") pushText(node.value);
      else pushNode(node);
    }
  };

  const openFrame = (tag: Frame["tag"], raw: string): void => {
    stack.push({
      tag,
      raw,
      nodes: [],
      accountId: null,
      time: null,
      metaConsumed: false,
      title: null,
    });
  };

  /** 閉じタグを処理する。スタック最上位と一致しない場合は false を返す。 */
  const closeFrame = (tag: Frame["tag"]): boolean => {
    // [title] は本文用のコンテナではないため、別の閉じタグが来たら暗黙に閉じる。
    while (tag !== "title" && top()?.tag === "title") unwind();

    const frame = top();
    if (frame === undefined || frame.tag !== tag) return false;
    stack.pop();

    switch (frame.tag) {
      case "title": {
        // [title] は [info] の直後でのみ開かれるため、親は必ず [info]。
        const parent = top();
        if (parent !== undefined) parent.title = frame.nodes;
        return true;
      }
      case "qt":
        pushNode({
          type: "quote",
          accountId: frame.accountId,
          time: frame.time,
          children: frame.nodes,
        });
        return true;
      case "info":
        pushNode({
          type: "info",
          title: frame.title,
          children: frame.nodes,
        });
        return true;
    }
  };

  let index = 0;
  while (index < source.length) {
    if (source[index] !== "[") {
      const next = source.indexOf("[", index);
      const end = next === -1 ? source.length : next;
      pushText(source.slice(index, end));
      index = end;
      continue;
    }

    const tag = readTag(source, index);
    if (tag === null) {
      pushText("[");
      index += 1;
      continue;
    }
    const { inner, raw } = tag;

    // [url] の中身はタグとして解釈せず、最初の [/url] までをそのまま URL とする。
    if (inner === "url") {
      const closeAt = source.indexOf(URL_CLOSE, index + raw.length);
      const url = closeAt === -1 ? "" : source.slice(index + raw.length, closeAt);
      if (closeAt !== -1 && url !== "") {
        pushNode({ type: "url", url });
        index = closeAt + URL_CLOSE.length;
        continue;
      }
      pushText("[");
      index += 1;
      continue;
    }

    if (inner === "qt" || inner === "info") {
      openFrame(inner, raw);
      index += raw.length;
      continue;
    }

    if (inner === "title") {
      const parent = top();
      if (
        parent?.tag === "info" &&
        parent.title === null &&
        parent.nodes.length === 0
      ) {
        openFrame("title", raw);
        index += raw.length;
        continue;
      }
      pushText("[");
      index += 1;
      continue;
    }

    if (inner === "/qt" || inner === "/info" || inner === "/title") {
      if (closeFrame(inner.slice(1) as Frame["tag"])) {
        index += raw.length;
        continue;
      }
      pushText("[");
      index += 1;
      continue;
    }

    if (inner === "hr") {
      pushNode({ type: "hr" });
      index += raw.length;
      continue;
    }

    const to = TO_PATTERN.exec(inner);
    if (to !== null) {
      pushNode({ type: "to", accountId: Number(to[1]) });
      index += raw.length;
      continue;
    }

    const reply = REPLY_PATTERN.exec(inner);
    if (reply !== null) {
      pushNode({
        type: "reply",
        accountId: Number(reply[1]),
        roomId: Number(reply[2]),
        messageId: String(reply[3]),
      });
      index += raw.length;
      continue;
    }

    const account = ACCOUNT_PATTERN.exec(inner);
    if (account !== null) {
      const type = account[1] as "picon" | "pname" | "piconname";
      pushNode({ type, accountId: Number(account[2]) });
      index += raw.length;
      continue;
    }

    // [qtmeta] は [qt] の直後にある場合のみ引用のメタ情報として扱う。
    const meta = QTMETA_PATTERN.exec(inner);
    if (meta !== null) {
      const parent = top();
      if (
        parent?.tag === "qt" &&
        !parent.metaConsumed &&
        parent.nodes.length === 0
      ) {
        parent.accountId = Number(meta[1]);
        parent.time = Number(meta[2]);
        parent.metaConsumed = true;
        index += raw.length;
        continue;
      }
    }

    pushText("[");
    index += 1;
  }

  while (stack.length > 0) unwind();

  return root;
}
