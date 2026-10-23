import assert from "node:assert/strict";
import { test } from "node:test";

import { appOrigin, courseShareUrl } from "./share";

test("a shared course link uses the course slug on the configured origin", () => {
  assert.equal(
    courseShareUrl("decn-101-principles-of-economics", "https://quizmi.example"),
    "https://quizmi.example/courses/decn-101-principles-of-economics"
  );
});

test("a trailing slash on the configured origin does not double up", () => {
  assert.equal(
    courseShareUrl("demo-english-usage", "https://quizmi.example///"),
    "https://quizmi.example/courses/demo-english-usage"
  );
});

test("slugs are encoded so the link stays valid", () => {
  assert.equal(
    courseShareUrl("course with spaces", "https://quizmi.example"),
    "https://quizmi.example/courses/course%20with%20spaces"
  );
});

test("the origin can come from the environment", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "https://from-env.example/";
  try {
    assert.equal(appOrigin(), "https://from-env.example");
    assert.equal(
      courseShareUrl("gst-112"),
      "https://from-env.example/courses/gst-112"
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  }
});
