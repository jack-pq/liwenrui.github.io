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
import { formatDate, cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, X, Star, LayoutGrid, List, BookOpen, Film, Music, Tv } from "lucide-react";

const TYPES = [
  { key: "书籍", icon: BookOpen },
  { key: "电影", icon: Film },
  { key: "剧集", icon: Tv },
  { key: "音乐", icon: Music },
];
const STATUSES = ["想看", "在看", "看过"];
const STATUS_COLORS: Record<string, string> = {
  想看: "bg-ink-100 text-ink-600",
  在看: "bg-clay-100 text-clay-700",
  看过: "bg-sage-100 text-sage-700",
};

function StarRating({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          disabled={!onChange}
          className={cn("transition-colors", onChange && "hover:scale-110 cursor-pointer")}
        >
          <Star size={size} className={s <= value ? "fill-clay-400 text-clay-400" : "text-ink-200"} />
        </button>
      ))}
    </div>
  );
}

const emptyForm = () => ({
  标题: "",
  类型: "书籍",
  状态: "想看",
  星级: 0,
  短评: "",
  封面: "",
  完成日期: null,
});

export default function CollectionPage() {
  const { show } = useToast();
  const { data: records, loading, error, reload } = useAsync<ApiRecord[]>(
    () => listRecords("collection", { sort: [{ field_name: "完成日期", desc: true }] }),
    []
  );
  const [form, setForm] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"wall" | "list">("wall");
  const [filterType, setFilterType] = useState("全部");
  const [filterStatus, setFilterStatus] = useState("全部");
  const [search, setSearch] = useState("");

  const year = new Date().getFullYear();
  const yearStart = new Date(year, 0, 1).getTime();

  const yearStats = useMemo(() => {
    const yearRecords = (records || []).filter((r) => r.fields["完成日期"] && r.fields["完成日期"] >= yearStart);
    const byType: Record<string, number> = {};
    yearRecords.forEach((r) => {
      const t = r.fields["类型"] || "其他";
      byType[t] = (byType[t] || 0) + 1;
    });
    return { total: yearRecords.length, byType };
  }, [records, yearStart]);

  const avgRating = useMemo(() => {
    const rated = (records || []).filter((r) => r.fields["星级"] > 0);
    if (rated.length === 0) return 0;
    return rated.reduce((s, r) => s + (r.fields["星级"] || 0), 0) / rated.length;
  }, [records]);

  const filtered = useMemo(() => {
    return (records || []).filter((r) => {
      if (filterType !== "全部" && r.fields["类型"] !== filterType) return false;
      if (filterStatus !== "全部" && r.fields["状态"] !== filterStatus) return false;
      if (search && !(r.fields["标题"] || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [records, filterType, filterStatus, search]);

  const handleSave = async () => {
    if (!form.标题?.trim()) {
      show("请输入标题", "error");
      return;
    }
    try {
      if (editingId) {
        await updateRecord("collection", editingId, form);
        show("已更新", "success");
      } else {
        await createRecord("collection", form);
        show("已收藏", "success");
      }
      setForm(null);
      setEditingId(null);
      reload();
    } catch (err: any) {
      show(err.message || "保存失败", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("collection", id);
      show("已删除", "success");
      reload();
    } catch (err: any) {
      show(err.message || "删除失败", "error");
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <RetryError message={error} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="section-title">书影收藏</h1>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); }} className="btn-primary">
          <Plus size={16} /> 添加
        </button>
      </div>

      <div className="surface p-5">
        <p className="text-sm text-ink-500 mb-3">{year}年度</p>
        <div className="flex items-end gap-6">
          <div>
            <p className="stat-value text-ink-800">{yearStats.total}</p>
            <p className="stat-label mt-1">完成总数</p>
          </div>
          {TYPES.map((t) => (
            <div key={t.key}>
              <p className="stat-value text-clay-600">{yearStats.byType[t.key] || 0}</p>
              <p className="stat-label mt-1">{t.key}</p>
            </div>
          ))}
          <div>
            <p className="stat-value text-clay-500">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
            <p className="stat-label mt-1">平均评分</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {["全部", ...TYPES.map((t) => t.key)].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={cn("chip px-3 py-1.5", filterType === t ? "bg-ink-800 text-ink-50" : "bg-ink-50 text-ink-500 hover:bg-ink-100")}>{t}</button>
          ))}
          <span className="w-px h-4 bg-ink-100 mx-1" />
          {["全部", ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={cn("chip px-3 py-1.5", filterStatus === s ? "bg-clay-500 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100")}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-40 py-1.5 text-sm"
            placeholder="搜索标题..."
          />
          <div className="flex items-center gap-1 bg-ink-50 rounded-xl p-1">
            <button onClick={() => setView("wall")} className={cn("p-1.5 rounded-lg transition-colors", view === "wall" ? "bg-white text-ink-800 shadow-sm" : "text-ink-400")}><LayoutGrid size={16} /></button>
            <button onClick={() => setView("list")} className={cn("p-1.5 rounded-lg transition-colors", view === "list" ? "bg-white text-ink-800 shadow-sm" : "text-ink-400")}><List size={16} /></button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="还没有收藏" hint="添加你看过或想看的书、电影、音乐" />
      ) : view === "wall" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((r) => {
            const TypeIcon = TYPES.find((t) => t.key === r.fields["类型"])?.icon || BookOpen;
            return (
              <div key={r.record_id} className="group cursor-pointer" onClick={() => { setEditingId(r.record_id); setForm({ ...r.fields }); }}>
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-ink-100 relative shadow-soft">
                  {r.fields["封面"] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.fields["封面"]} alt={r.fields["标题"]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ink-300 gap-2">
                      <TypeIcon size={32} strokeWidth={1.5} />
                      <span className="text-xs px-2 text-center line-clamp-2">{r.fields["标题"]}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.record_id); }} className="p-1 text-white/80 hover:text-white"><Trash2 size={13} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(r.record_id); setForm({ ...r.fields }); }} className="p-1 text-white/80 hover:text-white"><Pencil size={13} /></button>
                    </div>
                  </div>
                  <span className={cn("absolute top-2 left-2 chip text-[9px] backdrop-blur-sm", STATUS_COLORS[r.fields["状态"]] || "bg-white/80 text-ink-600")}>{r.fields["状态"]}</span>
                </div>
                <p className="text-sm font-medium text-ink-800 mt-2 truncate">{r.fields["标题"]}</p>
                {r.fields["星级"] > 0 && <div className="mt-0.5"><StarRating value={r.fields["星级"]} size={12} /></div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface divide-y divide-ink-50">
          {filtered.map((r) => {
            const TypeIcon = TYPES.find((t) => t.key === r.fields["类型"])?.icon || BookOpen;
            return (
              <div key={r.record_id} className="p-4 flex items-center gap-4 group hover:bg-ink-50/40 transition-colors">
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-ink-100 shrink-0 flex items-center justify-center text-ink-300">
                  {r.fields["封面"] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.fields["封面"]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <TypeIcon size={18} strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-800 truncate">{r.fields["标题"]}</span>
                    <span className={cn("chip text-[10px] shrink-0", STATUS_COLORS[r.fields["状态"]] || "bg-ink-50 text-ink-400")}>{r.fields["状态"]}</span>
                  </div>
                  {r.fields["短评"] && <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{r.fields["短评"]}</p>}
                  <p className="text-xs text-ink-300 mt-0.5">{r.fields["类型"]}{r.fields["完成日期"] ? ` · ${formatDate(r.fields["完成日期"])}` : ""}</p>
                </div>
                {r.fields["星级"] > 0 && <StarRating value={r.fields["星级"]} size={13} />}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(r.record_id); setForm({ ...r.fields }); }} className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(r.record_id)} className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 animate-slideUp max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">{editingId ? "编辑" : "添加"}收藏</h3>
              <button onClick={() => setForm(null)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">标题</label>
                <input value={form.标题 || ""} onChange={(e) => setForm({ ...form, 标题: e.target.value })} className="input" placeholder="书名/电影名/专辑名" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">类型</label>
                  <select value={form.类型} onChange={(e) => setForm({ ...form, 类型: e.target.value })} className="input">
                    {TYPES.map((t) => <option key={t.key} value={t.key}>{t.key}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">状态</label>
                  <select value={form.状态} onChange={(e) => setForm({ ...form, 状态: e.target.value, 完成日期: e.target.value === "看过" && !form.完成日期 ? Date.now() : form.完成日期 })} className="input">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">星级</label>
                <StarRating value={form.星级 || 0} onChange={(v) => setForm({ ...form, 星级: v })} size={22} />
              </div>
              <div>
                <label className="label">封面链接</label>
                <input value={form.封面 || ""} onChange={(e) => setForm({ ...form, 封面: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="label">短评</label>
                <textarea value={form.短评 || ""} onChange={(e) => setForm({ ...form, 短评: e.target.value })} className="input min-h-[80px]" placeholder="一句话感受" />
              </div>
              {form.状态 === "看过" && (
                <div>
                  <label className="label">完成日期</label>
                  <input type="date" value={form.完成日期 ? formatDate(form.完成日期) : ""} onChange={(e) => setForm({ ...form, 完成日期: e.target.value ? new Date(e.target.value).getTime() : null })} className="input" />
                </div>
              )}
              <button onClick={handleSave} className="btn-primary w-full py-3">{editingId ? "保存修改" : "添加收藏"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
