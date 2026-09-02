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
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Trash2, X, Check, ShoppingCart, ExternalLink } from "lucide-react";

const CATEGORIES = ["食物", "日用", "电子", "衣物", "其他"];
const CAT_COLORS: Record<string, string> = {
  食物: "bg-sage-100 text-sage-700",
  日用: "bg-clay-100 text-clay-700",
  电子: "bg-ink-100 text-ink-700",
  衣物: "bg-ink-50 text-ink-500",
  其他: "bg-ink-50 text-ink-400",
};

export default function ShoppingPage() {
  const { show } = useToast();
  const { data: records, loading, error, reload } = useAsync<ApiRecord[]>(
    () => listRecords("shopping"),
    []
  );
  const [form, setForm] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const pending = useMemo(
    () => (records || []).filter((r) => !r.fields["是否购买"]),
    [records]
  );
  const done = useMemo(
    () => (records || []).filter((r) => r.fields["是否购买"]),
    [records]
  );
  const totalEst = pending.reduce((s, r) => s + (r.fields["预估价格"] || 0) * (r.fields["数量"] || 1), 0);

  const handleSave = async () => {
    if (!form.名称?.trim()) {
      show("请输入名称", "error");
      return;
    }
    try {
      if (editingId) {
        await updateRecord("shopping", editingId, form);
        show("已更新", "success");
      } else {
        await createRecord("shopping", form);
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
      await updateRecord("shopping", r.record_id, { ...r.fields, 是否购买: !r.fields["是否购买"] });
      reload();
    } catch (err: any) {
      show(err.message || "操作失败", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord("shopping", id);
      show("已删除", "success");
      reload();
    } catch (err: any) {
      show(err.message || "删除失败", "error");
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <RetryError message={error} onRetry={reload} />;

  const renderItem = (r: ApiRecord) => {
    const cat = r.fields["分类"] || "其他";
    return (
      <div key={r.record_id} className="p-4 flex items-center gap-3 group hover:bg-ink-50/40 transition-colors">
        <button
          onClick={() => handleToggle(r)}
          className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors", r.fields["是否购买"] ? "bg-sage-500 border-sage-500 text-white" : "border-ink-200 hover:border-sage-400")}
        >
          {r.fields["是否购买"] && <Check size={13} strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", r.fields["是否购买"] ? "text-ink-300 line-through" : "text-ink-800")}>{r.fields["名称"]}</span>
            <span className={cn("chip text-[10px]", CAT_COLORS[cat] || CAT_COLORS["其他"])}>{cat}</span>
            {r.fields["数量"] > 1 && <span className="text-xs text-ink-400">×{r.fields["数量"]}</span>}
          </div>
          {r.fields["链接"] && (
            <a href={r.fields["链接"]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-clay-500 hover:underline mt-0.5">
              <ExternalLink size={10} /> 链接
            </a>
          )}
        </div>
        {r.fields["预估价格"] > 0 && (
          <span className="text-sm text-ink-500 tabular-nums shrink-0">¥{formatCurrency(r.fields["预估价格"] * (r.fields["数量"] || 1))}</span>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setEditingId(r.record_id); setForm({ ...r.fields }); }} className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg text-xs">编辑</button>
          <button onClick={() => handleDelete(r.record_id)} className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="section-title">待买清单</h1>
        <button onClick={() => { setForm({ 名称: "", 数量: 1, 预估价格: 0, 分类: "食物", 是否购买: false, 链接: "" }); setEditingId(null); }} className="btn-primary">
          <Plus size={16} /> 添加
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="surface p-5">
          <p className="stat-label">待购买</p>
          <p className="stat-value text-ink-800 mt-1">{pending.length}</p>
        </div>
        <div className="surface p-5">
          <p className="stat-label">已购买</p>
          <p className="stat-value text-sage-600 mt-1">{done.length}</p>
        </div>
        <div className="surface p-5 col-span-2 sm:col-span-1">
          <p className="stat-label">预估总额</p>
          <p className="stat-value text-clay-600 mt-1">¥{formatCurrency(totalEst)}</p>
        </div>
      </div>

      {pending.length === 0 && done.length === 0 ? (
        <EmptyState title="清单是空的" hint="添加你需要购买的东西" />
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="surface divide-y divide-ink-50">
              <h2 className="text-sm font-medium text-ink-700 p-4 border-b border-ink-100">待购买</h2>
              {pending.map(renderItem)}
            </div>
          )}
          {done.length > 0 && (
            <div className="surface divide-y divide-ink-50 opacity-70">
              <h2 className="text-sm font-medium text-ink-400 p-4 border-b border-ink-100">已购买</h2>
              {done.map(renderItem)}
            </div>
          )}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">{editingId ? "编辑" : "添加"}项目</h3>
              <button onClick={() => setForm(null)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">名称</label>
                <input value={form.名称 || ""} onChange={(e) => setForm({ ...form, 名称: e.target.value })} className="input" placeholder="如：牛奶、纸巾" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">数量</label>
                  <input type="number" value={form.数量 || 1} onChange={(e) => setForm({ ...form, 数量: Number(e.target.value) })} className="input" min={1} />
                </div>
                <div>
                  <label className="label">预估价格</label>
                  <input type="number" value={form.预估价格 || ""} onChange={(e) => setForm({ ...form, 预估价格: Number(e.target.value) })} className="input" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="label">分类</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, 分类: c })} className={cn("chip px-3 py-1.5", form.分类 === c ? "bg-ink-800 text-ink-50" : "bg-ink-50 text-ink-500 hover:bg-ink-100")}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">链接（可选）</label>
                <input value={form.链接 || ""} onChange={(e) => setForm({ ...form, 链接: e.target.value })} className="input" placeholder="https://" />
              </div>
              <button onClick={handleSave} className="btn-primary w-full py-3">{editingId ? "保存" : "添加"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
