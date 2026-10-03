import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SavedTextPreview } from "./saved-text-preview";

describe("SavedTextPreview", () => {
  it("escapes dangerous markup instead of executing it", () => {
    const markup = renderToStaticMarkup(
      <SavedTextPreview
        text={'<script>alert("x")</script><img src=x onerror=alert(1)>'}
      />,
    );

    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<img");
    expect(markup).toContain("&lt;script&gt;");
    expect(markup).toContain("&lt;img");
  });
});
