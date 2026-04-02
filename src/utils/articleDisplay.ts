import type { Article } from "@/types";

/**
 * Decode HTML entities trong plain-text (ví dụ title từ RSS feed).
 * Dùng textarea để browser xử lý tất cả entities (&apos; &amp; &#39; …).
 * Fallback regex cho môi trường không có DOM.
 */
export function decodeEntities(text: string): string {
  if (!text) return text;
  if (typeof document === "undefined") {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ");
  }
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

/** Nhãn nguồn báo: ưu tiên `source_name` từ API, không thì hostname của link */
export function getArticleSourceLabel(article: Pick<Article, "link" | "source_name">): string {
  const name = article.source_name?.trim();
  if (name) return name;
  try {
    return new URL(article.link).hostname.replace(/^www\./i, "") || "—";
  } catch {
    return "—";
  }
}
