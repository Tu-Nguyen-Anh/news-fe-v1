import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useArticleFilter } from "@/hooks/useArticles";
import { useSourceFilter } from "@/hooks/useSources";
import { useTopicFilter } from "@/hooks/useTopics";
import { useUserFilter } from "@/hooks/useUsers";
import { useArticleGrowth, useArticlesBySource, useArticleDaily } from "@/hooks/useDashboard";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const MONTH_SHORT = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
const CHART_COLORS = [
  "#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#3B82F6","#EC4899","#14B8A6","#F97316","#84CC16",
];
const PIE_COLORS = [
  "#6366F1","#8B5CF6","#EC4899","#F59E0B",
  "#10B981","#3B82F6","#EF4444","#14B8A6",
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 11-4 0 2 2 0 014 0zM3 18a2 2 0 114 0" />
  </svg>
);
const IconSources = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l6 6v8a2 2 0 01-2 2zM15 2v6h6" />
  </svg>
);
const IconTopics = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
  </svg>
);
const IconArticles = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM7 9h10M7 13h6" />
  </svg>
);
const IconTrend = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, gradient, sub, trend,
}: {
  label: string;
  value: number | undefined;
  icon: React.ReactNode;
  gradient: string;
  sub?: string;
  trend?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">
            {value === undefined ? (
              <span className="inline-block h-8 w-20 animate-pulse rounded-lg bg-white/20" />
            ) : (
              value.toLocaleString("vi-VN")
            )}
          </p>
          {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
              <IconTrend />
              {trend}
            </div>
          )}
        </div>
        <div className="shrink-0 rounded-xl bg-white/20 p-2.5 text-white/90">{icon}</div>
      </div>
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -right-2 -bottom-10 h-16 w-16 rounded-full bg-white/10" />
    </div>
  );
}

// ─── Year Picker ──────────────────────────────────────────────────────────────

function YearPicker({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
      {YEAR_OPTIONS.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => onChange(y)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            y === value
              ? "bg-white text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300"
              : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}

// ─── Chart Wrapper ────────────────────────────────────────────────────────────

function ChartCard({
  title, subtitle, action, children, minH = 280,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  minH?: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-50 px-5 py-4 dark:border-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5" style={{ minHeight: minH }}>
        {children}
      </div>
    </div>
  );
}

// ─── Loading Placeholder ──────────────────────────────────────────────────────

function ChartSkeleton({ h = 280 }: { h?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height: h }}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
        <p className="text-xs text-gray-400 dark:text-gray-500">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

function GrowthTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-300">
        {payload[0].value.toLocaleString("vi-VN")}
        <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">bài</span>
      </p>
    </div>
  );
}

function SourceTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <div className="space-y-1.5">
        {sorted.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="max-w-[140px] truncate text-xs text-gray-700 dark:text-gray-200">{p.dataKey}</span>
            <span className="ml-auto text-xs font-bold" style={{ color: p.color }}>
              {p.value.toLocaleString("vi-VN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl">
      <p className="mb-1 max-w-[180px] truncate text-xs font-semibold text-gray-700">{item.name}</p>
      <p className="text-base font-bold text-indigo-600">
        {item.value.toLocaleString("vi-VN")}
        <span className="ml-1 text-xs font-normal text-gray-400">bài</span>
      </p>
      <p className="text-xs text-gray-400">{(item.payload.percent * 100).toFixed(1)}%</p>
    </div>
  );
}

function DailyTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Ngày {label}</p>
      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300">
        {payload[0].value.toLocaleString("vi-VN")}
        <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">bài</span>
      </p>
    </div>
  );
}

// ─── Month+Year Picker ────────────────────────────────────────────────────────

function MonthYearPicker({ year, month, onChangeYear, onChangeMonth }: {
  year: number;
  month: number;
  onChangeYear: (y: number) => void;
  onChangeMonth: (m: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={month}
        onChange={(e) => onChangeMonth(Number(e.target.value))}
        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      >
        {MONTH_SHORT.map((name, i) => (
          <option key={i} value={i + 1}>{name}</option>
        ))}
      </select>
      <YearPicker value={year} onChange={onChangeYear} />
    </div>
  );
}

// ─── Source Total Table ───────────────────────────────────────────────────────

function SourceTotalsTable({ sources, colors }: {
  sources: Array<{ source_id: number; source_name: string; total: number }>;
  colors: string[];
}) {
  const max = sources[0]?.total ?? 1;
  return (
    <div className="mt-4 space-y-2">
      {sources.map((s, i) => (
        <div key={s.source_id} className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: colors[i % colors.length] }}
          />
          <span className="w-28 truncate text-xs font-medium text-gray-700 dark:text-gray-200" title={s.source_name}>
            {s.source_name}
          </span>
          <div className="flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((s.total / max) * 100)}%`,
                  background: colors[i % colors.length],
                }}
              />
            </div>
          </div>
          <span
            className="w-12 text-right text-xs font-bold tabular-nums"
            style={{ color: colors[i % colors.length] }}
          >
            {s.total.toLocaleString("vi-VN")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [dailyYear, setDailyYear] = useState(CURRENT_YEAR);
  const [dailyMonth, setDailyMonth] = useState(CURRENT_MONTH);

  // ── Stat counts ──────────────────────────────────────────────────────────
  const { data: users } = useUserFilter({ page: 0, size: 1 });
  const { data: sources } = useSourceFilter({ page: 0, size: 1 });
  const { data: topics } = useTopicFilter({ page: 0, size: 1 });
  const { data: articles } = useArticleFilter({ page: 0, size: 1 });

  // ── Dashboard API charts ─────────────────────────────────────────────────
  const { data: growthData, isPending: growthLoading } = useArticleGrowth(year);
  const { data: sourceData, isPending: sourceLoading } = useArticlesBySource(year);
  const { data: dailyData, isPending: dailyLoading } = useArticleDaily(dailyYear, dailyMonth);

  // ── Topic pie (from light batch fetch) ───────────────────────────────────
  const { data: batchData, isPending: batchLoading } = useArticleFilter({ page: 0, size: 200 });
  const batchArticles = batchData?.content ?? [];

  const topicPieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of batchArticles) {
      const key = a.topic_name || "Chưa phân loại";
      map[key] = (map[key] ?? 0) + 1;
    }
    const sorted = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    if (sorted.length <= 8) return sorted;
    const top7 = sorted.slice(0, 7);
    const other = sorted.slice(7).reduce((s, x) => s + x.value, 0);
    return [...top7, { name: "Khác", value: other }];
  }, [batchArticles]);

  // ── Growth area chart data ────────────────────────────────────────────────
  const growthChartData = useMemo(() => {
    if (!growthData) return [];
    return growthData.months.map((m) => ({
      month: MONTH_SHORT[m.month - 1],
      count: m.count,
    }));
  }, [growthData]);

  // ── By-source multi-line data ─────────────────────────────────────────────
  const topSources = useMemo(() => {
    if (!sourceData) return [];
    return [...sourceData.sources].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [sourceData]);

  const sourceChartData = useMemo(() => {
    if (!topSources.length) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const row: Record<string, string | number> = { month: MONTH_SHORT[i] };
      for (const src of topSources) {
        row[src.source_name] = src.monthly_data[i]?.count ?? 0;
      }
      return row;
    });
  }, [topSources]);

  // ── Daily bar chart data ──────────────────────────────────────────────
  const dailyChartData = useMemo(() => {
    if (!dailyData) return [];
    return dailyData.days.map((d) => ({ day: d.day, count: d.count }));
  }, [dailyData]);

  // ── Greeting ─────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const todayStr = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{todayStr}</p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              {greeting}
              {user ? (
                <>
                  ,{" "}
                  <span className="text-yellow-300">{user.full_name.split(" ").pop()}</span>{" "}
                  👋
                </>
              ) : null}
            </h1>
            <p className="mt-1 text-sm text-white/70">Đây là tổng quan hệ thống hôm nay</p>
          </div>

          {/* Quick pill stats */}
          {articles && (
            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
                <p className="text-lg font-extrabold leading-none">{articles.amount.toLocaleString("vi-VN")}</p>
                <p className="mt-0.5 text-xs text-white/70">Bài viết</p>
              </div>
              {sources && (
                <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
                  <p className="text-lg font-extrabold leading-none">{sources.amount.toLocaleString("vi-VN")}</p>
                  <p className="mt-0.5 text-xs text-white/70">Nguồn tin</p>
                </div>
              )}
              {topics && (
                <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
                  <p className="text-lg font-extrabold leading-none">{topics.amount.toLocaleString("vi-VN")}</p>
                  <p className="mt-0.5 text-xs text-white/70">Chủ đề</p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 -right-4 h-32 w-32 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-4 right-1/3 h-16 w-16 rounded-full bg-white/5" />
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Người dùng"
          value={users?.amount}
          icon={<IconUsers />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          sub="Tài khoản hệ thống"
        />
        <StatCard
          label="Nguồn tin"
          value={sources?.amount}
          icon={<IconSources />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          sub="RSS feeds đang theo dõi"
        />
        <StatCard
          label="Chủ đề"
          value={topics?.amount}
          icon={<IconTopics />}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          sub="Topic đã phân loại"
        />
        <StatCard
          label="Bài viết"
          value={articles?.amount}
          icon={<IconArticles />}
          gradient="bg-gradient-to-br from-rose-500 to-pink-600"
          sub="Tổng bài đã thu thập"
        />
      </div>

      {/* ── Growth area chart ───────────────────────────────────────────────── */}
      <ChartCard
        title="Tăng trưởng bài viết theo tháng"
        subtitle={
          growthData
            ? `Tổng năm ${year}: ${growthData.total.toLocaleString("vi-VN")} bài viết`
            : `Năm ${year}`
        }
        action={<YearPicker value={year} onChange={setYear} />}
        minH={260}
      >
        {growthLoading ? (
          <ChartSkeleton h={240} />
        ) : !growthData || growthData.total === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Không có dữ liệu cho năm {year}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={growthChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip content={<GrowthTooltip />} cursor={{ stroke: "#E0E7FF", strokeWidth: 2 }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366F1"
                strokeWidth={2.5}
                fill="url(#growthGrad)"
                dot={{ r: 3.5, fill: "#6366F1", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Daily articles bar chart ──────────────────────────────────────── */}
      <ChartCard
        title="Bài viết theo ngày"
        subtitle={
          dailyData
            ? `Tháng ${dailyMonth}/${dailyYear} — tổng ${dailyData.total.toLocaleString("vi-VN")} bài`
            : `Tháng ${dailyMonth}/${dailyYear}`
        }
        action={
          <MonthYearPicker
            year={dailyYear}
            month={dailyMonth}
            onChangeYear={setDailyYear}
            onChangeMonth={setDailyMonth}
          />
        }
        minH={260}
      >
        {dailyLoading ? (
          <ChartSkeleton h={240} />
        ) : !dailyData || dailyData.total === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Không có dữ liệu tháng {dailyMonth}/{dailyYear}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={dailyData.total_days > 28 ? 8 : 14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                interval={dailyData.total_days > 28 ? 2 : 1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={40}
              />
              <Tooltip content={<DailyTooltip />} cursor={{ fill: "#F0FDF4" }} />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── By-source multi-line chart ─────────────────────────────────────── */}
      <ChartCard
        title="Bài viết theo nguồn tin"
        subtitle={
          sourceData
            ? `${topSources.length} nguồn — năm ${year}${topSources.length === 10 ? " (top 10)" : ""}`
            : `Năm ${year}`
        }
        action={<YearPicker value={year} onChange={setYear} />}
        minH={300}
      >
        {sourceLoading ? (
          <ChartSkeleton h={280} />
        ) : !topSources.length ? (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 h-10 w-10 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Không có dữ liệu cho năm {year}</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sourceChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={40}
                />
                <Tooltip content={<SourceTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 12 }}
                  formatter={(value: string) => (
                    <span style={{ fontSize: 11, color: "#6B7280" }}>
                      {value.length > 18 ? value.slice(0, 18) + "…" : value}
                    </span>
                  )}
                />
                {topSources.map((src, i) => (
                  <Line
                    key={src.source_id}
                    type="monotone"
                    dataKey={src.source_name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: CHART_COLORS[i % CHART_COLORS.length] }}
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Source totals table */}
            <SourceTotalsTable
              sources={topSources}
              colors={CHART_COLORS}
            />
          </>
        )}
      </ChartCard>

      {/* ── Topic distribution ─────────────────────────────────────────────── */}
      <ChartCard
        title="Phân bố theo chủ đề"
        subtitle={`Dựa trên ${batchArticles.length.toLocaleString("vi-VN")} bài viết gần nhất`}
        minH={300}
      >
        {batchLoading ? (
          <ChartSkeleton h={280} />
        ) : topicPieData.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có dữ liệu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Donut */}
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={topicPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={105}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {topicPieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend table */}
            <div className="flex flex-col justify-center space-y-2.5">
              {topicPieData.map((item, i) => {
                const total = topicPieData.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                const color = PIE_COLORS[i % PIE_COLORS.length];
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    <span
                      className="flex-1 truncate text-xs font-medium text-gray-700 dark:text-gray-200"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">{pct}%</span>
                    <span className="w-10 text-right text-xs font-bold" style={{ color }}>
                      {item.value.toLocaleString("vi-VN")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ChartCard>

    </div>
  );
}
