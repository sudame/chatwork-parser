import assert from "node:assert/strict";
import { test } from "node:test";

import { parse } from "../src/parse.ts";
import type { ChatworkNode } from "../src/types.ts";

export type TestCase = {
  /** テストケース名 */
  name: string;
  /** 入力となる Chatwork メッセージ本文 */
  input: string;
  /** 期待される JSON 構造 */
  expected: ChatworkNode[];
};

/** 入力文字列をパースした結果が期待する JSON と一致することを検査する。 */
export function runCases(cases: TestCase[]): void {
  for (const testCase of cases) {
    test(testCase.name, () => {
      assert.deepEqual(parse(testCase.input), testCase.expected);
    });
  }
}
