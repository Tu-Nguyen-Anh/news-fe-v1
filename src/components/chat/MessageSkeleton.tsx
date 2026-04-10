/**
 * Skeleton screen for the initial chat load.
 * Criteria 5: Skeleton Screen thay cho spinner.
 */
export function MessageSkeleton() {
  return (
    <div className="space-y-3 px-4 py-4 select-none" aria-hidden="true">
      {/* Other's message */}
      <div className="flex items-end gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 animate-pulse" />
        <div className="flex flex-col gap-1 max-w-[60%]">
          <div className="h-3 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
          <div className="h-9 w-48 rounded-2xl rounded-bl-sm bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>

      {/* My message */}
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="h-9 w-56 rounded-2xl rounded-br-sm bg-primary-200/60 dark:bg-primary-900/30 animate-pulse" />
      </div>

      {/* Other's message — longer, no avatar (same sender) */}
      <div className="flex items-end gap-2">
        <div className="w-8 shrink-0" />
        <div className="h-9 w-64 rounded-2xl rounded-bl-sm bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* My message — multiline */}
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="h-14 w-44 rounded-2xl rounded-br-sm bg-primary-200/60 dark:bg-primary-900/30 animate-pulse" />
      </div>

      {/* Other's message — new sender */}
      <div className="flex items-end gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 animate-pulse" />
        <div className="flex flex-col gap-1 max-w-[60%]">
          <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
          <div className="h-9 w-36 rounded-2xl rounded-bl-sm bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>

      {/* My message */}
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="h-9 w-52 rounded-2xl rounded-br-sm bg-primary-200/60 dark:bg-primary-900/30 animate-pulse" />
      </div>

      {/* Other's message — long */}
      <div className="flex items-end gap-2">
        <div className="w-8 shrink-0" />
        <div className="h-9 w-72 rounded-2xl rounded-bl-sm bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  );
}
