import type { Article } from "@/types";

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
