import { describe, expect, it } from "vite-plus/test";

import { sanitizeUrl } from "./privacy";

describe("sanitizeUrl", () => {
  it("removes query strings and fragments from absolute URLs", () => {
    expect(sanitizeUrl("https://veo.example/teams/123?token=secret#details")).toBe(
      "https://veo.example/teams/123",
    );
  });

  it("keeps relative paths relative", () => {
    expect(sanitizeUrl("/teams/123?invite=secret")).toBe("/teams/123");
  });

  it("redacts invitation tokens stored in route paths", () => {
    expect(sanitizeUrl("https://veo.example/invite/sensitive-token?source=email")).toBe(
      "https://veo.example/invite/[redacted]",
    );
  });
});
