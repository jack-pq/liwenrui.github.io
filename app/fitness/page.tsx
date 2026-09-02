"use client";

import { useState, useMemo, useEffect } from "react";
import { useAsync } from "@/lib/hooks";
import {
  listRecords,
  createRecord,
  deleteRecord,
  type ApiRecord,
} from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { RetryError } from "@/components/RetryError";
import { formatDate, movingAverage, cn, todayStart, dateKey } from "@/lib/utils";
import { Plus, Trash2, X, Activity, Target, Flame, TrendingDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export default function FitnessPage() {
  const { show } = useToast();
  const { data: records, loading, error, reload } = useAsync<ApiRecord[]>(
    () => listRecords("fitness", { sort: [{ field_name: "日期", desc: true }] }),
    []
  );

  const [height, setHeight] = useState(170);
  const [targetWeight, setTargetWeight] = useState(65);
  const [weekPlan, setWeekPlan] = useState<string[]>(["", "", "", "", "", "", ""]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    日期: Date.now(),
    体重: 0,
    体脂率: 0,
    热量摄入: 0,
    热量消耗: 0,
    备注: "",
  });

  useEffect(() => {
    const h = localStorage.getItem("fitness_height");
    const t = localStorage.getItem("fitness_target");
    const p = localStorage.getItem("fitness_weekplan");
    if (h) setHeight(Number(h));
    if (t) setTargetWeight(Number(t));
    if (p) {
      try { setWeekPlan(JSON.parse(p)); } catch {}
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("fitness_height", String(height));
    localStorage.setItem("fitness_target", String(targetWeight));
    localStorage.setItem("fitness_weekplan", JSON.stringify(weekPlan));
    setShowSettings(false);
    show("设置已保存", "success");
  };

  const sortedAsc = useMemo(
    () => (records || [])
      .filter((r) => r.fields["日期"] && r.fields["体重"])
      .sort((a, b) => a.fields["日期"] - b.fields["日期"]),
    [records]
  );

  const latest = sortedAsc[sortedAsc.length - 1];
  const weight = latest?.fields["体重"];
  const bodyFat = latest?.fields["体脂率"];
  const bmi = weight ? (weight / Math.pow(height / 100, 2)) : null;
  const startWeight = sortedAsc[0]?.fields["体重"];
  const progress = startWeight && weight
    ? Math.min(((startWeight - weight) / (startWeight - targetWeight)) * 100, 100)
    : 0;

  const todayKey = dateKey(new Date());
  const todayRecord = (records || []).find((r) => dateKey(new Date(r.fields["日期"])) === todayKey);
  const todayIntake = todayRecord?.fields["热量摄入"] || 0;
  const todayBurn = todayRecord?.fields["热量消耗"] || 0;
  const calorieGap = todayBurn - todayIntake;

  const chartData = useMemo(() => {
    const weights = sortedAsc.map((r) => r.fields["体重"]);
    const ma7 = movingAverage(weights, 7);
    return sortedAsc.map((r, i) => ({
      date: formatDate(r.fields["日期"]).slice(5),
      weight: r.fields["体重"],
      ma7: ma7[i],
    }));
  }, [sortedAsc]);

  const handleAdd = async () => {
    if (!form.体重 || form.体重 <= 0) {
      show("请输入体重", "error");
      return;
    }
    try {
      await createRecord("fitness", {
        ...form,
        体脂率: form.体脂率 || null,
        热量摄入: form.热量摄入 || null,
        热量消耗: form.热量消耗 || null,
      });
      show("已记录", "success");
      setForm({ 日期: Date.now(), 体重: 0, 体脂率: 0, 热量摄入: 0, 热量消耗: 0, 备注: "" });
      setShowAdd(false);
      reload();
    } catch (err: any) {
      show(err.message || "保存失败", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("fitness", id);
      show("已删除", "success");
      reload();
    } catch (err: any) {
      show(err.message || "删除失败", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error) return <RetryError message={error} onRetry={reload} />;

  const bmiCategory = bmi
    ? bmi < 18.5 ? ["偏瘦", "text-clay-500"]
    : bmi < 24 ? ["正常", "text-sage-600"]
    : bmi < 28 ? ["超重", "text-clay-600"]
    : ["肥胖", "text-red-500"]
    : ["-", ""];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="section-title">减脂健身</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="btn-ghost">
            <Target size={16} /> 设置
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={16} /> 记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface p-5">
          <div className="flex items-center gap-2 text-ink-400 mb-2">
            <Activity size={14} /><span className="stat-label">当前体重</span>
          </div>
          <p className="stat-value text-ink-800">{weight ? `${weight}kg` : "—"}</p>
          {sortedAsc.length >= 2 && (() => {
            const diff = weight - sortedAsc[sortedAsc.length - 2].fields["体重"];
            return (
              <p className={cn("text-xs font-medium mt-1 tabular-nums", diff < 0 ? "text-sage-600" : diff > 0 ? "text-clay-600" : "text-ink-400")}>
                {diff < 0 ? "↓" : diff > 0 ? "↑" : "→"} {Math.abs(diff).toFixed(1)}kg 较上次
              </p>
            );
          })()}
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2 text-ink-400 mb-2">
            <TrendingDown size={14} /><span className="stat-label">BMI</span>
          </div>
          <p className="stat-value text-ink-800">{bmi ? bmi.toFixed(1) : "—"}</p>
          {bmi && <span className={`text-xs font-medium ${bmiCategory[1]}`}>{bmiCategory[0]}</span>}
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2 text-ink-400 mb-2">
            <Target size={14} /><span className="stat-label">目标进度</span>
          </div>
          <p className="stat-value text-sage-600">{progress > 0 ? `${progress.toFixed(0)}%` : "—"}</p>
        </div>
        <div className="surface p-5">
          <div className="flex items-center gap-2 text-ink-400 mb-2">
            <Flame size={14} /><span className="stat-label">今日热量缺口</span>
          </div>
          <p className={cn("stat-value", calorieGap > 0 ? "text-sage-600" : "text-clay-600")}>
            {calorieGap !== 0 ? `${calorieGap > 0 ? "+" : ""}${calorieGap}` : "—"}
          </p>
          <span className="text-xs text-ink-400">kcal</span>
        </div>
      </div>

      <div className="surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-ink-700">体重趋势</h2>
          {targetWeight && (
            <span className="text-xs text-ink-400">目标 {targetWeight}kg</span>
          )}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a87f50" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a87f50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#7d7560" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7d7560" }} axisLine={false} tickLine={false} width={36} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip
                formatter={(v: number, n: string) => [`${v}kg`, n === "ma7" ? "7日均线" : "体重"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #ede9e0", fontSize: 12 }}
              />
              <Area dataKey="weight" stroke="none" fill="url(#weightArea)" />
              <Line dataKey="weight" stroke="#a87f50" strokeWidth={1.5} dot={{ r: 2, fill: "#a87f50" }} />
              <Line dataKey="ma7" stroke="#527552" strokeWidth={2} dot={false} strokeDasharray="4 3" />
              {targetWeight && <ReferenceLine y={targetWeight} stroke="#9fbc9f" strokeDasharray="3 3" />}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-ink-400 py-16 text-center">暂无体重记录</p>
        )}
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-medium text-ink-700 mb-4">本周计划</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {WEEKDAYS.map((day, i) => (
            <div key={day} className="flex items-center gap-2 p-3 rounded-xl bg-ink-50/50">
              <span className="text-xs font-medium text-ink-400 w-8 shrink-0">{day}</span>
              <input
                value={weekPlan[i] || ""}
                onChange={(e) => {
                  const next = [...weekPlan];
                  next[i] = e.target.value;
                  setWeekPlan(next);
                }}
                onBlur={() => localStorage.setItem("fitness_weekplan", JSON.stringify(weekPlan))}
                className="flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-300 outline-none"
                placeholder="休息"
              />
            </div>
          ))}
        </div>
      </div>

      {(records || []).length > 0 && (
        <div className="surface">
          <h2 className="text-sm font-medium text-ink-700 p-4 border-b border-ink-100">历史记录</h2>
          <div className="divide-y divide-ink-50">
            {(records || []).slice(0, 20).map((r) => (
              <div key={r.record_id} className="p-4 flex items-center gap-3 group hover:bg-ink-50/40 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink-800 tabular-nums">{r.fields["体重"]}kg</span>
                    {r.fields["体脂率"] && <span className="text-xs text-clay-500">{r.fields["体脂率"]}%</span>}
                    {r.fields["热量摄入"] && <span className="text-xs text-ink-400">摄入 {r.fields["热量摄入"]}</span>}
                    {r.fields["热量消耗"] && <span className="text-xs text-ink-400">消耗 {r.fields["热量消耗"]}</span>}
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {formatDate(r.fields["日期"])}
                    {r.fields["备注"] ? ` · ${r.fields["备注"]}` : ""}
                  </p>
                </div>
                <button onClick={() => handleDelete(r.record_id)} className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 animate-slideUp max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">记录数据</h3>
              <button onClick={() => setShowAdd(false)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">日期</label>
                <input type="date" value={formatDate(form.日期)} onChange={(e) => setForm({ ...form, 日期: new Date(e.target.value).getTime() })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">体重 (kg)</label>
                  <input type="number" step="0.1" value={form.体重 || ""} onChange={(e) => setForm({ ...form, 体重: Number(e.target.value) })} className="input" placeholder="0" autoFocus />
                </div>
                <div>
                  <label className="label">体脂率 (%)</label>
                  <input type="number" step="0.1" value={form.体脂率 || ""} onChange={(e) => setForm({ ...form, 体脂率: Number(e.target.value) })} className="input" placeholder="可选" />
                </div>
                <div>
                  <label className="label">热量摄入 (kcal)</label>
                  <input type="number" value={form.热量摄入 || ""} onChange={(e) => setForm({ ...form, 热量摄入: Number(e.target.value) })} className="input" placeholder="可选" />
                </div>
                <div>
                  <label className="label">热量消耗 (kcal)</label>
                  <input type="number" value={form.热量消耗 || ""} onChange={(e) => setForm({ ...form, 热量消耗: Number(e.target.value) })} className="input" placeholder="可选" />
                </div>
              </div>
              <div>
                <label className="label">备注</label>
                <input value={form.备注} onChange={(e) => setForm({ ...form, 备注: e.target.value })} className="input" placeholder="可选" />
              </div>
              <button onClick={handleAdd} className="btn-primary w-full py-3">确认记录</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">个人设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">身高 (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input" />
              </div>
              <div>
                <label className="label">目标体重 (kg)</label>
                <input type="number" step="0.1" value={targetWeight} onChange={(e) => setTargetWeight(Number(e.target.value))} className="input" />
              </div>
              <button onClick={saveSettings} className="btn-primary w-full py-3">保存设置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
