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
import { formatDateTime, formatDate, cn, todayStart } from "@/lib/utils";
import { Plus, Trash2, Pencil, X, Check, CalendarDays } from "lucide-react";

const CATEGORIES = [
  { key: "工作", color: "bg-clay-100 text-clay-700" },
  { key: "生活", color: "bg-sage-100 text-sage-700" },
  { key: "健康", color: "bg-ink-100 text-ink-700" },
  { key: "其他", color: "bg-ink-50 text-ink-500" },
];

const emptyForm = () => ({
  日期时间: Date.now(),
  标题: "",
  描述: "",
  类型: "工作",
  是否完成: false,
});

export default function SchedulePage() {
  const { show } = useToast();
  const { data: records, loading, error, reload } = useAsync<ApiRecord[]>(
    () => listRecords("schedule", { sort: [{ field_name: "日期时间", desc: false }] }),
    []
  );
  const [form, setForm] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const todayTs = todayStart().getTime();
  const upcoming = useMemo(
    () => (records || []).filter((r) => r.fields["日期时间"] >= todayTs && !r.fields["是否完成"]),
    [records, todayTs]
  );
  const todayEnd = todayTs + 86400000;
  const todayEvents = useMemo(
    () => (records || []).filter((r) => r.fields["日期时间"] >= todayTs && r.fields["日期时间"] < todayEnd).sort((a, b) => a.fields["日期时间"] - b.fields["日期时间"]),
    [records, todayTs, todayEnd]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, ApiRecord[]> = {};
    (records || []).forEach((r) => {
      const key = formatDate(r.fields["日期时间"]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [records]);

  const handleSave = async () => {
    if (!form.标题?.trim()) {
      show("请输入标题", "error");
      return;
    }
    try {
      if (editingId) {
        await updateRecord("schedule", editingId, form);
        show("已更新", "success");
      } else {
        await createRecord("schedule", form);
        show("已添加", "success");
      }
      setForm(null);
      setEditingId(null);
      reload();
    } catch (err: any) {
      show(err.message || "保存失败", "error");
    }
  };

  const handleToggle = async (r: ApiRecord) => {
    try {
      await updateRecord("schedule", r.record_id, { ...r.fields, 是否完成: !r.fields["是否完成"] });
      reload();
    } catch (err: any) {
      show(err.message || "操作失败", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("schedule", id);
      show("已删除", "success");
      reload();
    } catch (err: any) {
      show(err.message || "删除失败", "error");
    }
  };

  const openEdit = (r: ApiRecord) => {
    setEditingId(r.record_id);
    setForm({ ...r.fields });
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <RetryError message={error} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="section-title">日程统筹</h1>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); }} className="btn-primary">
          <Plus size={16} /> 新建日程
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface p-5">
          <p className="stat-label">今日</p>
          <p className="stat-value text-ink-800 mt-1">{todayEvents.length}</p>
          <p className="text-xs text-ink-400 mt-1">个事项</p>
          {todayEvents.length > 0 && (
            <div className="mt-3">
              {(() => {
                const done = todayEvents.filter((r) => r.fields["是否完成"]).length;
                const pct = Math.round((done / todayEvents.length) * 100);
                return (
                  <>
                    <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sage-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-ink-400 mt-1">完成率 {pct}%（{done}/{todayEvents.length}）</p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
        <div className="surface p-5">
          <p className="stat-label">待办</p>
          <p className="stat-value text-clay-600 mt-1">{upcoming.length}</p>
          <p className="text-xs text-ink-400 mt-1">个未完成</p>
        </div>
        <div className="surface p-5">
          <p className="stat-label">下一个</p>
          {upcoming.length > 0 ? (
            <>
              <p className="text-sm font-medium text-ink-800 mt-1 truncate">{upcoming[0].fields["标题"]}</p>
              <p className="text-xs text-ink-400 mt-0.5">{formatDateTime(upcoming[0].fields["日期时间"])}</p>
            </>
          ) : (
            <p className="text-sm text-ink-400 mt-1">暂无待办</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {grouped.length === 0 ? (
          <EmptyState title="暂无日程" hint="点击右上角新建日程" />
        ) : (
          grouped.map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-ink-400 mb-2 px-1">{date}</h2>
              <div className="surface divide-y divide-ink-50">
                {items.map((r) => {
                  const cat = CATEGORIES.find((c) => c.key === r.fields["类型"]) || CATEGORIES[3];
                  const done = r.fields["是否完成"];
                  return (
                    <div key={r.record_id} className="p-4 flex items-center gap-3 group hover:bg-ink-50/40 transition-colors">
                      <button
                        onClick={() => handleToggle(r)}
                        className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors", done ? "bg-sage-500 border-sage-500 text-white" : "border-ink-200 hover:border-sage-400")}
                      >
                        {done && <Check size={13} strokeWidth={3} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium", done ? "text-ink-300 line-through" : "text-ink-800")}>{r.fields["标题"]}</span>
                          <span className={cn("chip text-[10px]", cat.color)}>{r.fields["类型"]}</span>
                        </div>
                        <p className="text-xs text-ink-400 mt-0.5">
                          {new Date(r.fields["日期时间"]).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                          {r.fields["描述"] ? ` · ${r.fields["描述"]}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(r.record_id)} className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">{editingId ? "编辑日程" : "新建日程"}</h3>
              <button onClick={() => setForm(null)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">标题</label>
                <input value={form.标题 || ""} onChange={(e) => setForm({ ...form, 标题: e.target.value })} className="input" placeholder="如：晨跑、开会、体检" autoFocus />
              </div>
              <div>
                <label className="label">时间</label>
                <input type="datetime-local" value={new Date(form.日期时间 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={(e) => setForm({ ...form, 日期时间: new Date(e.target.value).getTime() })} className="input" />
              </div>
              <div>
                <label className="label">分类</label>
                <div className="flex gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setForm({ ...form, 类型: c.key })} className={cn("chip px-3 py-1.5", form.类型 === c.key ? c.color : "bg-ink-50 text-ink-400 hover:bg-ink-100")}>{c.key}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">描述</label>
                <textarea value={form.描述 || ""} onChange={(e) => setForm({ ...form, 描述: e.target.value })} className="input min-h-[80px]" placeholder="可选" />
              </div>
              <button onClick={handleSave} className="btn-primary w-full py-3">{editingId ? "保存修改" : "添加日程"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
