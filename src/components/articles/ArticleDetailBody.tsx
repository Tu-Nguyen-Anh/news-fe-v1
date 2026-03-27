import { useLayoutEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import type { Article } from "@/types";
import { getArticleSourceLabel } from "@/utils/articleDisplay";
import { IMAGE_FALLBACK_URL, SafeImage } from "@/components/ui/SafeImage";
import { sanitizeArticleHtml, stripImagesMatchingSrcFromHtml } from "@/utils/sanitizeHtml";
import { cn } from "@/utils/cn";

function formatDate(ts: number | null) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const descriptionClassName =
  "article-description max-w-none border-t border-gray-100 pt-4 text-sm leading-relaxed text-gray-700 [&_a]:break-all [&_a]:text-blue-600 hover:[&_a]:underline [&_img]:my-2 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-md [&_p]:my-2";

type Props = {
  article?: Article;
  isLoading: boolean;
  /** Chỉ dùng trong popup: hiện nút Sửa cạnh “Xem bài gốc”. Trang `/articles/$id` giữ nút Sửa ở header. */
  editArticleId?: string;
  className?: string;
};

export function ArticleDetailBody({ article, isLoading, editArticleId, className }: Props) {
  const descRef = useRef<HTMLDivElement>(null);

  const descriptionHtml =
    !isLoading && article?.description
      ? stripImagesMatchingSrcFromHtml(sanitizeArticleHtml(article.description), article.image_link)
      : null;

  useLayoutEffect(() => {
    const root = descRef.current;
    if (!root) return;
    const imgs = root.querySelectorAll("img");
    const onErr = (ev: Event) => {
      const t = ev.target as HTMLImageElement;
      if (t.dataset.fallbackImg === "1") return;
      t.dataset.fallbackImg = "1";
      t.src = IMAGE_FALLBACK_URL;
    };
    imgs.forEach((img) => img.addEventListener("error", onErr));
    return () => imgs.forEach((img) => img.removeEventListener("error", onErr));
  }, [descriptionHtml]);

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Đang tải...</div>;
  }
  if (!article) {
    return <div className="py-8 text-center text-gray-500">Không tìm thấy bài viết.</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {article.image_link ? (
        <figure className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
          <SafeImage
            src={article.image_link}
            alt=""
            className="max-h-52 w-full object-cover sm:max-h-56"
          />
        </figure>
      ) : null}
      <h3 className="text-xl font-bold text-gray-900">{article.title}</h3>
      <div className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Nguồn báo</p>
          <p className="mt-1 font-semibold text-gray-900">{getArticleSourceLabel(article)}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Chủ đề (topic)</p>
          <p className="mt-1 font-semibold text-gray-900">{article.topic_name}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Ngày đăng</p>
          <p className="mt-1 font-medium text-gray-800">{formatDate(article.pub_date)}</p>
        </div>
      </div>
      {descriptionHtml ? (
        <div
          ref={descRef}
          className={descriptionClassName}
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : null}
      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        <a
          href={article.link}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Xem bài gốc ↗
        </a>
        {editArticleId ? (
          <Link
            to="/articles/$id/edit"
            params={{ id: editArticleId }}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Sửa
          </Link>
        ) : null}
      </div>
    </div>
  );
}
