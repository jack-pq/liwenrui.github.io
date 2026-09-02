"use client";

import { useState, useEffect } from "react";
import { useAsync } from "@/lib/hooks";
import { listRecords } from "@/lib/api-client";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency, todayStart, monthStart, formatDate } from "@/lib/utils";
import {
  Wallet,
  CheckSquare,
  Activity,
  CalendarDays,
  ShoppingCart,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { TableName } from "@/lib/api-client";

const QUOTES = [
  "把每一天都当作生命的第一天。",
  "小的习惯，大的改变。",
  "今日事，今日毕。",
  "慢慢来，比较快。",
  "生活不是等待暴风雨过去，而是学会在雨中起舞。",
  "每一笔记录，都是对生活的认真。",
  "坚持的另一个名字，叫习惯。",
  "理财就是理生活。",
  "健康是1，其他都是0。",
  "好记性不如烂笔头。",
];

const NIGHT_QUOTES = [
  "今天辛苦了，好好休息。",
  "放下手机，让眼睛也休息一下。",
  "好的睡眠是最好的保养。",
  "今天的事今天毕，明天的事明天起。",
  "晚安，明天又是新的一天。",
];

interface GreetingInfo {
  title: string;
  subtitle: string;
}

function getGreeting(d: Date): GreetingInfo {
  const h = d.getHours();
  if (h < 5) return { title: "夜深了", subtitle: "注意休息，别熬太晚" };
  if (h < 8) return { title: "清晨好", subtitle: "新的一天，元气满满" };
  if (h < 11) return { title: "早上好", subtitle: "精力充沛，开始吧" };
  if (h < 13) return { title: "中午好", subtitle: "记得吃午饭" };
  if (h < 14) return { title: "午后", subtitle: "小憩片刻再继续" };
  if (h < 17) return { title: "下午好", subtitle: "保持专注，稳步推进" };
  if (h < 19) return { title: "傍晚好", subtitle: "一天将尽，收拾心情" };
  if (h < 22) return { title: "晚上好", subtitle: "放松一下，享受生活" };
  return { title: "夜深了", subtitle: "早点休息，晚安" };
}

function getQuote(d: Date): string {
  const h = d.getHours();
  if (h >= 22 || h < 5) return NIGHT_QUOTES[d.getDate() % NIGHT_QUOTES.length];
  return QUOTES[d.getDate() % QUOTES.length];
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="tabular-nums">
      {String(time.getHours()).padStart(2, "0")}:{String(time.getMinutes()).padStart(2, "0")}:{String(time.getSeconds()).padStart(2, "0")}
    </span>
  );
}

function SafeCard({
  table,
  children,
  fallback,
}: {
  table: TableName;
  children: (records: any[]) => React.ReactNode;
  fallback: React.ReactNode;
}) {
  const { data, loading, error, reload } = useAsync(
    () => listRecords(table),
    []
  );
  if (loading) return <Skeleton className="h-36 w-full" />;
  if (error) {
    return (
      <div className="surface p-5 flex flex-col items-center justify-center text-center min-h-[144px]">
        <p className="text-sm text-ink-400">{fallback}</p>
        <button onClick={reload} className="text-xs text-clay-500 mt-2 hover:underline">
          重试
        </button>
      </div>
    );
  }
  return <>{children(data || [])}</>;
}

export default function HomePage() {
  const today = todayStart();
  const monthStartTs = monthStart().getTime();
  const todayStartTs = today.getTime();
  const todayEndTs = todayStartTs + 86400000;

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const greetingInfo = getGreeting(now);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-400">{formatDate(now)}</p>
          <h1 className="text-2xl font-medium text-ink-800 mt-1">
            {greetingInfo.title}，{greetingInfo.subtitle}
          </h1>
          <p className="text-sm text-clay-400 mt-2 font-serif">「{getQuote(now)}」</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-light text-ink-700 tabular-nums"><Clock /></p>
          <p className="text-xs text-ink-300 mt-1">现在</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SafeCard
          table="finance"
          fallback="记账数据暂不可用"
        >
          {(records) => {
            const monthRecords = records.filter((r) => {
              const d = r.fields["日期"];
              return d && d >= monthStartTs;
            });
            const income = monthRecords
              .filter((r) => r.fields["类型"] === "收入")
              .reduce((s, r) => s + (r.fields["金额"] || 0), 0);
            const expense = monthRecords
              .filter((r) => r.fields["类型"] === "支出")
              .reduce((s, r) => s + (r.fields["金额"] || 0), 0);
            return (
              <Link href="/finance" className="surface p-5 block hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <Wallet size={16} />
                    <span className="text-sm font-medium">本月收支</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="stat-label">收入</p>
                    <p className="stat-value text-sage-600">+{formatCurrency(income)}</p>
                  </div>
                  <div>
                    <p className="stat-label">支出</p>
                    <p className="stat-value text-clay-600">-{formatCurrency(expense)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
                  <span className="text-xs text-ink-400">结余</span>
                  <span className={`text-sm font-medium tabular-nums ${income - expense >= 0 ? "text-sage-600" : "text-red-500"}`}>
                    {formatCurrency(income - expense)}
                  </span>
                </div>
              </Link>
            );
          }}
        </SafeCard>

        <SafeCard
          table="habit"
          fallback="习惯数据暂不可用"
        >
          {(habits) => {
            const active = habits.filter((r) => r.fields["是否激活"] !== false);
            return (
              <Link href="/habit" className="surface p-5 block hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <CheckSquare size={16} />
                    <span className="text-sm font-medium">习惯打卡</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                <p className="stat-value text-ink-800">{active.length}</p>
                <p className="stat-label mt-1">个进行中的习惯</p>
                <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-1.5">
                  {active.slice(0, 4).map((h, i) => (
                    <span key={h.record_id} className="chip bg-ink-50 text-ink-500">
                      {h.fields["名称"] || `习惯${i + 1}`}
                    </span>
                  ))}
                  {active.length > 4 && (
                    <span className="chip bg-ink-50 text-ink-400">+{active.length - 4}</span>
                  )}
                </div>
              </Link>
            );
          }}
        </SafeCard>

        <SafeCard
          table="fitness"
          fallback="健身数据暂不可用"
        >
          {(records) => {
            const sorted = records
              .filter((r) => r.fields["日期"] && r.fields["体重"])
              .sort((a, b) => b.fields["日期"] - a.fields["日期"]);
            const latest = sorted[0];
            const weight = latest?.fields["体重"];
            const bodyFat = latest?.fields["体脂率"];
            return (
              <Link href="/fitness" className="surface p-5 block hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <Activity size={16} />
                    <span className="text-sm font-medium">体重趋势</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                {weight ? (
                  <>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="stat-label">最新体重</p>
                        <p className="stat-value text-ink-800">{weight}<span className="text-sm text-ink-400 ml-1">kg</span></p>
                      </div>
                      {bodyFat && (
                        <div>
                          <p className="stat-label">体脂率</p>
                          <p className="stat-value text-clay-600">{bodyFat}<span className="text-sm text-ink-400 ml-1">%</span></p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-ink-300 mt-3">
                      {latest ? formatDate(latest.fields["日期"]) : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-ink-400 py-6 text-center">暂无记录</p>
                )}
              </Link>
            );
          }}
        </SafeCard>

        <SafeCard
          table="schedule"
          fallback="日程数据暂不可用"
        >
          {(records) => {
            const todayEvents = records
              .filter((r) => {
                const d = r.fields["日期时间"];
                return d && d >= todayStartTs && d < todayEndTs;
              })
              .sort((a, b) => a.fields["日期时间"] - b.fields["日期时间"]);
            return (
              <Link href="/schedule" className="surface p-5 block hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <CalendarDays size={16} />
                    <span className="text-sm font-medium">今日日程</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                <p className="stat-value text-ink-800">{todayEvents.length}</p>
                <p className="stat-label mt-1">个待办事项</p>
                {todayEvents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink-100 space-y-1">
                    {todayEvents.slice(0, 2).map((e) => (
                      <p key={e.record_id} className="text-xs text-ink-500 truncate">
                        {new Date(e.fields["日期时间"]).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} {e.fields["标题"]}
                      </p>
                    ))}
                  </div>
                )}
              </Link>
            );
          }}
        </SafeCard>

        <SafeCard
          table="shopping"
          fallback="清单数据暂不可用"
        >
          {(records) => {
            const pending = records.filter((r) => !r.fields["已购"]);
            return (
              <Link href="/shopping" className="surface p-5 block hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <ShoppingCart size={16} />
                    <span className="text-sm font-medium">待买清单</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                <p className="stat-value text-ink-800">{pending.length}</p>
                <p className="stat-label mt-1">件待购买</p>
                {pending.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-1.5">
                    {pending.slice(0, 3).map((s) => (
                      <span key={s.record_id} className="chip bg-clay-50 text-clay-600">
                        {s.fields["名称"]}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          }}
        </SafeCard>

        <SafeCard
          table="collection"
          fallback="收藏数据暂不可用"
        >
          {(records) => {
            const recent = records
              .filter((r) => r.fields["完成日期"])
              .sort((a, b) => b.fields["完成日期"] - a.fields["完成日期"]);
            const reading = records.filter((r) => r.fields["状态"] === "在看");
            return (
              <Link href="/collection" className="surface p-5 block hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-ink-500">
                    <BookOpen size={16} />
                    <span className="text-sm font-medium">书影收藏</span>
                  </div>
                  <ChevronRight size={16} className="text-ink-300" />
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="stat-label">在看</p>
                    <p className="stat-value text-ink-800">{reading.length}</p>
                  </div>
                  <div>
                    <p className="stat-label">已收藏</p>
                    <p className="stat-value text-clay-600">{records.length}</p>
                  </div>
                </div>
                {recent.length > 0 && (
                  <p className="text-xs text-ink-300 mt-3 pt-3 border-t border-ink-100 truncate">
                    最近完成：{recent[0].fields["标题"]}
                  </p>
                )}
              </Link>
            );
          }}
        </SafeCard>
      </div>
    </div>
  );
}
