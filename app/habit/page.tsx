"use client";

import { useState, useMemo } from "react";
import { useAsync } from "@/lib/hooks";
import {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  type ApiRecord,
} from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { RetryError } from "@/components/RetryError";
import { lastNDays, dateKey, cn, pickColor } from "@/lib/utils";
import { Plus, Trash2, X, Check, Minus, CheckSquare, Hash, Sliders } from "lucide-react";

const TRACK_TYPES = [
  { key: "勾选", label: "勾选", icon: CheckSquare },
  { key: "计数", label: "计数", icon: Hash },
  { key: "数值", label: "数值", icon: Sliders },
];

export default function HabitPage() {
  const { show } = useToast();
  const habitsAsync = useAsync<ApiRecord[]>(() => listRecords("habit"), []);
  const logsAsync = useAsync<ApiRecord[]>(
    () => listRecords("habit_log", { sort: [{ field_name: "日期", desc: true }] }),
    []
  );
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("勾选");
  const [newTarget, setNewTarget] = useState(1);
  const [newUnit, setNewUnit] = useState("");

  const loading = habitsAsync.loading || logsAsync.loading;
  const error = habitsAsync.error || logsAsync.error;
  const reload = () => { habitsAsync.reload(); logsAsync.reload(); };

  const days30 = useMemo(() => lastNDays(30), []);
  const todayKey = dateKey(new Date());

  const logsByHabit = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    (logsAsync.data || []).forEach((log) => {
      const habitId = log.fields["习惯ID"];
      const date = log.fields["日期"];
      if (!habitId || !date) return;
      const key = dateKey(new Date(date));
      if (!map[habitId]) map[habitId] = {};
      map[habitId][key] = (map[habitId][key] || 0) + (log.fields["值"] || 0);
    });
    return map;
  }, [logsAsync.data]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      show("请输入习惯名称", "error");
      return;
    }
    try {
      await createRecord("habit", {
        名称: newName.trim(),
        类型: newType,
        目标值: newTarget,
        单位: newUnit.trim(),
        颜色: "",
        是否激活: true,
        创建日期: Date.now(),
      });
      show("习惯已添加", "success");
      setNewName("");
      setNewType("勾选");
      setNewTarget(1);
      setNewUnit("");
      setShowAdd(false);
      habitsAsync.reload();
    } catch (err: any) {
      show(err.message || "添加失败", "error");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteRecord("habit", id);
      show(`已删除「${name}」`, "success");
      habitsAsync.reload();
    } catch (err: any) {
      show(err.message || "删除失败", "error");
    }
  };

  const handleCheck = async (habit: ApiRecord) => {
    const habitId = habit.record_id;
    const name = habit.fields["名称"];
    const trackType = habit.fields["类型"];
    const logs = logsByHabit[habitId] || {};
    const todayValue = logs[todayKey] || 0;

    try {
      if (trackType === "勾选") {
        if (todayValue > 0) {
          const todayLogs = (logsAsync.data || []).filter(
            (l) => l.fields["习惯ID"] === habitId && dateKey(new Date(l.fields["日期"])) === todayKey
          );
          for (const l of todayLogs) {
            await deleteRecord("habit_log", l.record_id);
          }
          show("已取消打卡", "info");
        } else {
          await createRecord("habit_log", {
            习惯ID: habitId,
            习惯名称: name,
            日期: Date.now(),
            值: 1,
          });
          show("打卡成功", "success");
        }
      } else if (trackType === "计数") {
        await createRecord("habit_log", {
          习惯ID: habitId,
          习惯名称: name,
          日期: Date.now(),
          值: 1,
        });
        show(`+1（今日：${todayValue + 1}）`, "success");
      }
      logsAsync.reload();
    } catch (err: any) {
      show(err.message || "打卡失败", "error");
    }
  };

  const handleValueInput = async (habit: ApiRecord, value: number) => {
    const habitId = habit.record_id;
    const name = habit.fields["名称"];
    const logs = logsByHabit[habitId] || {};
    const todayLogs = (logsAsync.data || []).filter(
      (l) => l.fields["习惯ID"] === habitId && dateKey(new Date(l.fields["日期"])) === todayKey
    );

    try {
      if (todayLogs.length > 0) {
        await updateRecord("habit_log", todayLogs[0].record_id, {
          习惯ID: habitId,
          习惯名称: name,
          日期: todayLogs[0].fields["日期"],
          值: value,
        });
      } else {
        await createRecord("habit_log", {
          习惯ID: habitId,
          习惯名称: name,
          日期: Date.now(),
          值: value,
        });
      }
      show("已记录", "success");
      logsAsync.reload();
    } catch (err: any) {
      show(err.message || "记录失败", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (error) return <RetryError message={error} onRetry={reload} />;

  const habits = (habitsAsync.data || []).filter((h) => h.fields["是否激活"] !== false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="section-title">习惯健康</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> 新建习惯
        </button>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          title="还没有习惯"
          hint="添加一个习惯，开始每日打卡"
          action={<button onClick={() => setShowAdd(true)} className="btn-primary"><Plus size={16} /> 新建习惯</button>}
        />
      ) : (
        <div className="space-y-4">
          {habits.map((habit, idx) => {
            const color = pickColor(idx);
            const trackType = habit.fields["类型"] || "勾选";
            const target = habit.fields["目标值"] || 1;
            const unit = habit.fields["单位"] || "";
            const logs = logsByHabit[habit.record_id] || {};
            const todayValue = logs[todayKey] || 0;
            const done = trackType === "勾选" ? todayValue > 0 : todayValue >= target;
            const completedDays = days30.filter((d) => {
              const v = logs[dateKey(d)] || 0;
              return trackType === "勾选" ? v > 0 : v >= target;
            }).length;

            let streak = 0;
            for (let i = 0; i < 30; i++) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              d.setHours(0, 0, 0, 0);
              const v = logs[dateKey(d)] || 0;
              if (trackType === "勾选" ? v > 0 : v >= target) streak++;
              else break;
            }

            return (
              <div key={habit.record_id} className="surface p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <div>
                      <h3 className="font-medium text-ink-800">{habit.fields["名称"]}</h3>
                      <p className="text-xs text-ink-400 mt-0.5">
                        {trackType}
                        {trackType !== "勾选" && ` · 目标 ${target}${unit}`}
                        {trackType === "计数" && todayValue > 0 && ` · 今日 ${todayValue}${unit}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400">{completedDays}/30 天</span>
                    {streak > 0 && <span className="chip bg-sage-50 text-sage-600 text-[10px]">连续 {streak} 天</span>}
                    <button onClick={() => handleDelete(habit.record_id, habit.fields["名称"])} className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1">
                  {days30.map((d) => {
                    const key = dateKey(d);
                    const v = logs[key] || 0;
                    const isDone = trackType === "勾选" ? v > 0 : v >= target;
                    const intensity = trackType === "勾选"
                      ? (v > 0 ? 1 : 0)
                      : Math.min(v / target, 1);
                    return (
                      <div
                        key={key}
                        title={`${key}: ${v}${unit}`}
                        className={cn(
                          "w-5 h-5 rounded-[3px] transition-colors",
                          !isDone && v === 0 && "bg-ink-100"
                        )}
                        style={isDone || v > 0 ? { backgroundColor: color, opacity: 0.3 + intensity * 0.7 } : undefined}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  {trackType === "勾选" && (
                    <button
                      onClick={() => handleCheck(habit)}
                      className={cn("btn flex-1 py-2.5", done ? "bg-sage-500 text-white" : "btn-outline")}
                    >
                      <Check size={16} /> {done ? "今日已完成" : "打卡"}
                    </button>
                  )}
                  {trackType === "计数" && (
                    <>
                      <button onClick={() => handleCheck(habit)} className="btn-primary py-2.5 px-5">
                        <Plus size={16} /> 打卡
                      </button>
                      <span className="text-sm text-ink-500 ml-auto">
                        今日 <span className="font-medium text-ink-800 tabular-nums">{todayValue}</span> / {target}{unit}
                      </span>
                    </>
                  )}
                  {trackType === "数值" && (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        defaultValue={todayValue || ""}
                        key={todayValue}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v > 0 && v !== todayValue) handleValueInput(habit, v);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="input flex-1"
                        placeholder={`输入数值（${unit || "值"}）`}
                      />
                      <span className="text-sm text-ink-400">/ {target}{unit}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">新建习惯</h3>
              <button onClick={() => setShowAdd(false)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">习惯名称</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="如：喝水、阅读、冥想" autoFocus />
              </div>
              <div>
                <label className="label">打卡方式</label>
                <div className="flex gap-2">
                  {TRACK_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.key} onClick={() => setNewType(t.key)} className={cn("flex-1 py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-colors", newType === t.key ? "border-ink-800 bg-ink-50 text-ink-800" : "border-ink-100 text-ink-400 hover:border-ink-200")}>
                        <Icon size={18} />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {newType !== "勾选" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">目标值</label>
                    <input type="number" value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} className="input" />
                  </div>
                  <div>
                    <label className="label">单位</label>
                    <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="input" placeholder="如：杯、分钟" />
                  </div>
                </div>
              )}
              <button onClick={handleAdd} className="btn-primary w-full py-3">创建习惯</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
