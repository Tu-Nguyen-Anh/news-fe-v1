import { useState, type ImgHTMLAttributes } from "react";
import fallbackAsset from "@/images/images.jpeg";
import { cn } from "@/utils/cn";

/** URL đã bundle (Vite) — dùng cho ảnh trong HTML (dangerouslySetInnerHTML) khi xử lý `error` */
export const IMAGE_FALLBACK_URL = fallbackAsset;

export type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

function SafeImageImpl({ src, className, alt = "", ...rest }: SafeImageProps) {
  const [broken, setBroken] = useState(false);
  const resolved = !src || broken ? fallbackAsset : src;

  return (
    <img
      src={resolved}
      alt={alt}
      className={cn(className)}
      onError={() => setBroken(true)}
      {...rest}
    />
  );
}

/**
 * Ảnh an toàn: URL rỗng hoặc lỗi tải → hiển thị {@link IMAGE_FALLBACK_URL}
 */
export function SafeImage(props: SafeImageProps) {
  return <SafeImageImpl key={props.src ?? "__empty__"} {...props} />;
}
