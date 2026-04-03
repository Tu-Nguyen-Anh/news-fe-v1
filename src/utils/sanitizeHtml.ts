import DOMPurify from "dompurify";

function imageUrlsEquivalent(a: string, b: string): boolean {
  const t = (s: string) => s.trim();
  const na = t(a);
  const nb = t(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  try {
    const ua = new URL(na, "https://placeholder.local");
    const ub = new URL(nb, "https://placeholder.local");
    if (ua.href === ub.href) return true;
    return ua.origin + ua.pathname === ub.origin + ub.pathname;
  } catch {
    return false;
  }
}

/**
 * Gỡ ảnh trong HTML mô tả trùng với ảnh đại diện (`image_link`) để tránh hiển thị 2 ảnh giống nhau.
 * Chạy sau `sanitizeArticleHtml`. Dùng DOMParser (chỉ trong trình duyệt).
 */
export function stripImagesMatchingSrcFromHtml(html: string, heroSrc: string | null | undefined): string {
  const hero = heroSrc?.trim();
  if (!hero || !html.trim()) return html;

  const wrapped = `<div data-article-root>${html}</div>`;
  const doc = new DOMParser().parseFromString(wrapped, "text/html");
  const root = doc.querySelector("[data-article-root]");
  if (!root) return html;

  const candidates = [...root.querySelectorAll("img[src]")];
  for (const img of candidates) {
    const src = img.getAttribute("src");
    if (!src || !imageUrlsEquivalent(src, hero)) continue;

    const parent = img.parentElement;
    if (
      parent?.tagName === "A" &&
      parent.children.length === 1 &&
      parent.firstElementChild === img
    ) {
      parent.remove();
    } else {
      img.remove();
    }
  }

  return root.innerHTML;
}

/** Sửa HTML entity bị double-encode: &amp;aacute; → &aacute; */
function fixDoubleEncodedEntities(html: string): string {
  return html.replace(/&amp;([a-zA-Z0-9]+|#\d+|#x[\da-fA-F]+);/g, "&$1;");
}

/** Cho phép HTML phổ biến từ RSS (ảnh, liên kết, đoạn văn) và loại bỏ script/on* */
export function sanitizeArticleHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "a",
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "img",
      "span",
      "div",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "figure",
      "figcaption",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "width", "height"],
  });
  return fixDoubleEncodedEntities(sanitized);
}
