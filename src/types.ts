/**
 * Chatwork メッセージ記法の AST 定義。
 * 記法の仕様: https://developer.chatwork.com/docs/message-notation
 */

/** タグとして解釈されなかった素のテキスト。連続するテキストは 1 ノードにまとめる。 */
export type TextNode = {
  type: "text";
  value: string;
};

/** `[To:{account_id}]` */
export type ToNode = {
  type: "to";
  accountId: number;
};

/** `[rp aid={account_id} to={room_id}-{message_id}]` */
export type ReplyNode = {
  type: "reply";
  accountId: number;
  roomId: number;
  /** メッセージ ID は桁数が大きく英数字も取りうるため文字列で保持する。 */
  messageId: string;
};

/** `[qt][qtmeta aid={account_id} time={timestamp}]...[/qt]` */
export type QuoteNode = {
  type: "quote";
  /** `[qtmeta]` が無い場合は null。 */
  accountId: number | null;
  /** 投稿時刻 (Unix 時間、秒)。`[qtmeta]` が無い場合は null。 */
  time: number | null;
  children: ChatworkNode[];
};

/** `[info]...[/info]` / `[info][title]...[/title]...[/info]` */
export type InfoNode = {
  type: "info";
  /** `[title]` が無い場合は null。 */
  title: ChatworkNode[] | null;
  children: ChatworkNode[];
};

/** `[hr]` */
export type HrNode = {
  type: "hr";
};

/** `[picon:{account_id}]` */
export type PiconNode = {
  type: "picon";
  accountId: number;
};

/** `[pname:{account_id}]` */
export type PnameNode = {
  type: "pname";
  accountId: number;
};

/** `[piconname:{account_id}]` */
export type PiconnameNode = {
  type: "piconname";
  accountId: number;
};

/** `[url]http://...[/url]` */
export type UrlNode = {
  type: "url";
  url: string;
};

export type ChatworkNode =
  | TextNode
  | ToNode
  | ReplyNode
  | QuoteNode
  | InfoNode
  | HrNode
  | PiconNode
  | PnameNode
  | PiconnameNode
  | UrlNode;
