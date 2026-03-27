/** Returns true if the given username belongs to the admin account. */
export function isAdmin(username: string | null | undefined): boolean {
  const normalized = username
    ?.trim()
    .toLowerCase()
    // strip leading '@' if backend returns it
    .replace(/^@/, "")
    // remove all whitespace inside
    .replace(/\s+/g, "");

  // Admin can come from:
  // - username: "admin"
  // - full name: "Nguyen Anh Tu"
  // (some endpoints may omit author_username)
  return normalized === "admin" || normalized === "nguyenanhtu";
}

/**
 * Super admin marker (used for user privilege gating).
 * Update the matching strings if BE uses different values.
 */
export function isSuperAdmin(username: string | null | undefined): boolean {
  const normalized = username
    ?.trim()
    .toLowerCase()
    // strip leading '@' if backend returns it
    .replace(/^@/, "")
    // remove all whitespace inside
    .replace(/\s+/g, "");

  return normalized === "superadmin" || normalized === "root";
}

/**
 * Facebook-style filled blue circle with white checkmark.
 * Use `size` prop for different contexts (reduced further): "sm" (~8px), "md" (~10px), "lg" (~14px).
 */
export function AdminBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-3.5 w-3.5" : size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Quản trị viên đã xác minh"
      className={`inline-block shrink-0 ${dim} scale-[1.2]`}
    >
      {/* Solid blue circle */}
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      {/* White checkmark */}
      <path
        d="M7 12.5l3.5 3.5 6.5-7"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ filter: "drop-shadow(0 0 0.6px rgba(255,255,255,0.95))" }}
      />
    </svg>
  );
}
