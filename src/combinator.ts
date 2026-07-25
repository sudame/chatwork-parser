/**
 * 最小限のパーサーコンビネーター。
 *
 * パーサーは「入力と開始位置を受け取り、成功なら値と次の位置を返す関数」。
 * 失敗しても位置を進めないので、呼び出し側は同じ位置から別の候補を試せる
 * （バックトラック）。
 */

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T; readonly index: number }
  | { readonly ok: false };

const FAILURE: ParseResult<never> = { ok: false };

export class Parser<T> {
  readonly run: (input: string, index: number) => ParseResult<T>;

  constructor(run: (input: string, index: number) => ParseResult<T>) {
    this.run = run;
  }

  /** 成功値を変換する。 */
  map<U>(transform: (value: T) => U): Parser<U> {
    return new Parser<U>((input, index) => {
      const result = this.run(input, index);
      if (!result.ok) return FAILURE;
      return { ok: true, value: transform(result.value), index: result.index };
    });
  }

  /** 続けて next を適用し、next の値を返す。 */
  then<U>(next: Parser<U>): Parser<U> {
    return new Parser<U>((input, index) => {
      const result = this.run(input, index);
      if (!result.ok) return FAILURE;
      return next.run(input, result.index);
    });
  }

  /** 続けて next を適用し、こちらの値を返す。 */
  skip(next: Parser<unknown>): Parser<T> {
    return new Parser<T>((input, index) => {
      const result = this.run(input, index);
      if (!result.ok) return FAILURE;
      const skipped = next.run(input, result.index);
      if (!skipped.ok) return FAILURE;
      return { ok: true, value: result.value, index: skipped.index };
    });
  }

  /**
   * 0 回以上の繰り返し。
   *
   * 1 文字も消費せずに成功した場合は無限ループになるため打ち切る。
   */
  many(): Parser<T[]> {
    return new Parser<T[]>((input, index) => {
      const values: T[] = [];
      let position = index;
      for (;;) {
        const result = this.run(input, position);
        if (!result.ok || result.index === position) break;
        values.push(result.value);
        position = result.index;
      }
      return { ok: true, value: values, index: position };
    });
  }
}

/** 固定の文字列にマッチする。 */
export function str(expected: string): Parser<string> {
  return new Parser<string>((input, index) => {
    if (!input.startsWith(expected, index)) return FAILURE;
    return { ok: true, value: expected, index: index + expected.length };
  });
}

/** 現在位置から始まる正規表現にマッチする。 */
export function regex(pattern: RegExp): Parser<string> {
  const flags = pattern.flags.includes("y") ? pattern.flags : `${pattern.flags}y`;
  const sticky = new RegExp(pattern.source, flags);
  return new Parser<string>((input, index) => {
    sticky.lastIndex = index;
    const matched = sticky.exec(input);
    if (matched === null) return FAILURE;
    return {
      ok: true,
      value: matched[0],
      index: index + matched[0].length,
    };
  });
}

/** 入力を消費せずに必ず成功する。 */
export function succeed<T>(value: T): Parser<T> {
  return new Parser<T>((_input, index) => ({ ok: true, value, index }));
}

/** 先頭から順に試し、最初に成功したものを返す。 */
export function alt<T>(...parsers: readonly Parser<T>[]): Parser<T> {
  return new Parser<T>((input, index) => {
    for (const parser of parsers) {
      const result = parser.run(input, index);
      if (result.ok) return result;
    }
    return FAILURE;
  });
}

type Values<T extends readonly Parser<unknown>[]> = {
  [K in keyof T]: T[K] extends Parser<infer U> ? U : never;
};

/** 順に適用し、それぞれの値をタプルで返す。1 つでも失敗したら全体が失敗する。 */
export function seq<T extends readonly Parser<unknown>[]>(
  ...parsers: T
): Parser<Values<T>> {
  return new Parser<Values<T>>((input, index) => {
    const values: unknown[] = [];
    let position = index;
    for (const parser of parsers) {
      const result = parser.run(input, position);
      if (!result.ok) return FAILURE;
      values.push(result.value);
      position = result.index;
    }
    return { ok: true, value: values as Values<T>, index: position };
  });
}

/** 再帰的な定義のために、パーサーの生成を初回実行まで遅らせる。 */
export function lazy<T>(make: () => Parser<T>): Parser<T> {
  let cached: Parser<T> | null = null;
  return new Parser<T>((input, index) => {
    cached ??= make();
    return cached.run(input, index);
  });
}

/** 入力を消費せず、parser が失敗するときだけ成功する（否定先読み）。 */
export function notFollowedBy(parser: Parser<unknown>): Parser<null> {
  return new Parser<null>((input, index) => {
    if (parser.run(input, index).ok) return FAILURE;
    return { ok: true, value: null, index };
  });
}

/** 省略可能。失敗した場合は入力を消費せず null を返す。 */
export function optional<T>(parser: Parser<T>): Parser<T | null> {
  return alt<T | null>(parser, succeed(null));
}

/** 入力の終端。 */
export const eof: Parser<null> = new Parser<null>((input, index) => {
  if (index !== input.length) return FAILURE;
  return { ok: true, value: null, index };
});
