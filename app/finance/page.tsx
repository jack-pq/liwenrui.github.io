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
import {
  formatCurrency,
  formatDate,
  monthStart,
  cn,
} from "@/lib/utils";
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "医疗", "教育", "住房", "工资", "理财", "其他"];
const PIE_COLORS = ["#527552", "#a87f50", "#7d7560", "#9fbc9f", "#d4bd9d", "#5f5947", "#bf9d72", "#3f5d3f", "#8a6640", "#bfb9a8"];

interface FinanceFields {
  日期: number;
  类型: string;
  金额: number;
  分类: string;
  备注: string;
}

function emptyForm(): FinanceFields {
  return {
    日期: Date.now(),
    类型: "支出",
    金额: 0,
    分类: "餐饮",
    备注: "",
  };
}

export default function FinancePage() {
  const { show } = useToast();
  const { data: records, loading, error, reload } = useAsync<ApiRecord[]>(
    () => listRecords("finance", { sort: [{ field_name: "日期", desc: true }] }),
    []
  );
  const [form, setForm] = useState<FinanceFields | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("全部");
  const [filterCategory, setFilterCategory] = useState<string>("全部");
  const [budget, setBudget] = useState<number>(5000);
  const [budgetInput, setBudgetInput] = useState(false);

  const monthStartTs = monthStart().getTime();
  const now = new Date();

  const monthRecords = useMemo(
    () => (records || []).filter((r) => r.fields["日期"] >= monthStartTs),
    [records, monthStartTs]
  );

  const monthIncome = monthRecords
    .filter((r) => r.fields["类型"] === "收入")
    .reduce((s, r) => s + (r.fields["金额"] || 0), 0);
  const monthExpense = monthRecords
    .filter((r) => r.fields["类型"] === "支出")
    .reduce((s, r) => s + (r.fields["金额"] || 0), 0);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthRecords
      .filter((r) => r.fields["类型"] === "支出")
      .forEach((r) => {
        const cat = r.fields["分类"] || "其他";
        map[cat] = (map[cat] || 0) + (r.fields["金额"] || 0);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthRecords]);

  const monthlyCompare = useMemo(() => {
    const months: { month: string; 收入: number; 支出: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const recs = (records || []).filter((r) => {
        const t = r.fields["日期"];
        return t >= start && t < end;
      });
      months.push({
        month: `${d.getMonth() + 1}月`,
        收入: recs.filter((r) => r.fields["类型"] === "收入").reduce((s, r) => s + (r.fields["金额"] || 0), 0),
        支出: recs.filter((r) => r.fields["类型"] === "支出").reduce((s, r) => s + (r.fields["金额"] || 0), 0),
      });
    }
    return months;
  }, [records, now]);

  const filtered = useMemo(() => {
    return (records || []).filter((r) => {
      if (filterType !== "全部" && r.fields["类型"] !== filterType) return false;
      if (filterCategory !== "全部" && r.fields["分类"] !== filterCategory) return false;
      return true;
    });
  }, [records, filterType, filterCategory]);

  const handleSave = async () => {
    if (!form) return;
    if (!form.金额 || form.金额 <= 0) {
      show("请输入有效金额", "error");
      return;
    }
    try {
      if (editingId) {
        await updateRecord("finance", editingId, form);
        show("已更新", "success");
      } else {
        await createRecord("finance", form);
        show("已记录", "success");
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
      await deleteRecord("finance", id);
      show("已删除", "success");
      reload();
    } catch (err: any) {
      show(err.message || "删除失败", "error");
    }
  };

  const openEdit = (r: ApiRecord) => {
    setEditingId(r.record_id);
    setForm({
      日期: r.fields["日期"] || Date.now(),
      类型: r.fields["类型"] || "支出",
      金额: r.fields["金额"] || 0,
      分类: r.fields["分类"] || "餐饮",
      备注: r.fields["备注"] || "",
    });
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

  const budgetUsed = Math.min((monthExpense / budget) * 100, 100);
  const dayOfMonth = new Date().getDate();
  const dailyAvg = monthExpense / dayOfMonth;

  const quickItems = [
    { label: "早餐", 金额: 10, 分类: "餐饮" },
    { label: "午餐", 金额: 20, 分类: "餐饮" },
    { label: "晚餐", 金额: 30, 分类: "餐饮" },
    { label: "咖啡", 金额: 15, 分类: "餐饮" },
    { label: "交通", 金额: 5, 分类: "交通" },
    { label: "购物", 金额: 50, 分类: "购物" },
  ];

  const handleQuickAdd = async (金额: number, 分类: string) => {
    try {
      await createRecord("finance", { 日期: Date.now(), 类型: "支出", 金额, 分类, 备注: "" });
      show(`已记录 ${分类} ¥${金额}`, "success");
      reload();
    } catch (err: any) {
      show(err.message || "保存失败", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="section-title">记账理财</h1>
        <button
          onClick={() => { setForm(emptyForm()); setEditingId(null); }}
          className="btn-primary"
        >
          <Plus size={16} /> 记一笔
        </button>
      </div>

      <div className="surface p-5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="stat-label">本月收入</p>
            <p className="stat-value text-sage-600 mt-1">+{formatCurrency(monthIncome)}</p>
          </div>
          <div>
            <p className="stat-label">本月支出</p>
            <p className="stat-value text-clay-600 mt-1">-{formatCurrency(monthExpense)}</p>
          </div>
          <div>
            <p className="stat-label">结余</p>
            <p className={cn("stat-value mt-1", monthIncome - monthExpense >= 0 ? "text-sage-600" : "text-red-500")}>
              {formatCurrency(monthIncome - monthExpense)}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-ink-100 flex items-center justify-between">
          <span className="text-xs text-ink-400">日均支出</span>
          <span className="text-sm font-medium text-ink-600 tabular-nums">¥{formatCurrency(dailyAvg)} / 天</span>
        </div>
        <div className="mt-5 pt-4 border-t border-ink-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-ink-500">月度预算</span>
            {budgetInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="input w-28 py-1"
                />
                <button onClick={() => setBudgetInput(false)} className="text-xs text-clay-500">确定</button>
              </div>
            ) : (
              <button onClick={() => setBudgetInput(true)} className="text-sm text-ink-700 font-medium tabular-nums hover:underline">
                ¥{formatCurrency(budget)}
              </button>
            )}
          </div>
          <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", budgetUsed > 90 ? "bg-red-400" : "bg-clay-400")}
              style={{ width: `${budgetUsed}%` }}
            />
          </div>
          <p className="text-xs text-ink-400 mt-1.5">
            已用 {formatCurrency(monthExpense)} / {formatCurrency(budget)}（{budgetUsed.toFixed(0)}%）
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-ink-400 mr-1">快速记账</span>
        {quickItems.map((q) => (
          <button
            key={q.label}
            onClick={() => handleQuickAdd(q.金额, q.分类)}
            className="chip px-3 py-1.5 bg-ink-50 text-ink-600 hover:bg-clay-100 hover:text-clay-700 transition-colors"
          >
            {q.label} ¥{q.金额}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface p-5">
          <h2 className="text-sm font-medium text-ink-700 mb-4">消费结构</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, n: string) => [`${formatCurrency(v)}元`, n]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #ede9e0", fontSize: 12 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-400 py-16 text-center">本月暂无支出</p>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-medium text-ink-700 mb-4">近6月对比</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCompare} barGap={2}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7d7560" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#7d7560" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(v: number) => [`${formatCurrency(v)}元`, ""]}
                contentStyle={{ borderRadius: 12, border: "1px solid #ede9e0", fontSize: 12 }}
              />
              <Bar dataKey="收入" fill="#527552" radius={[4, 4, 0, 0]} />
              <Bar dataKey="支出" fill="#a87f50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface">
        <div className="p-4 border-b border-ink-100 flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-ink-400" />
          {["全部", "支出", "收入"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn("chip transition-colors", filterType === t ? "bg-ink-800 text-ink-50" : "bg-ink-50 text-ink-500 hover:bg-ink-100")}
            >
              {t}
            </button>
          ))}
          <span className="w-px h-4 bg-ink-100 mx-1" />
          {["全部", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={cn("chip transition-colors", filterCategory === c ? "bg-clay-500 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100")}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="divide-y divide-ink-50">
          {filtered.length === 0 ? (
            <EmptyState title="暂无记录" hint="点击右上角「记一笔」开始" />
          ) : (
            filtered.map((r) => (
              <div key={r.record_id} className="p-4 flex items-center gap-3 hover:bg-ink-50/40 transition-colors group">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", r.fields["类型"] === "收入" ? "bg-sage-50 text-sage-600" : "bg-clay-50 text-clay-600")}>
                  {r.fields["类型"] === "收入" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-800">{r.fields["分类"] || "其他"}</span>
                    <span className="chip bg-ink-50 text-ink-400 text-[10px]">{r.fields["类型"]}</span>
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {formatDate(r.fields["日期"])}
                    {r.fields["备注"] ? ` · ${r.fields["备注"]}` : ""}
                  </p>
                </div>
                <span className={cn("text-sm font-medium tabular-nums shrink-0", r.fields["类型"] === "收入" ? "text-sage-600" : "text-clay-600")}>
                  {r.fields["类型"] === "收入" ? "+" : "-"}{formatCurrency(r.fields["金额"] || 0)}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(r)} className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-lg">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(r.record_id)} className="p-1.5 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-ink-800">{editingId ? "编辑记录" : "记一笔"}</h3>
              <button onClick={() => setForm(null)} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {["支出", "收入"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, 类型: t })}
                    className={cn("flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors", form.类型 === t ? "bg-ink-800 text-ink-50" : "bg-ink-50 text-ink-500")}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">金额</label>
                <input type="number" value={form.金额 || ""} onChange={(e) => setForm({ ...form, 金额: Number(e.target.value) })} className="input text-lg font-medium" placeholder="0" autoFocus />
              </div>
              <div>
                <label className="label">分类</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, 分类: c })} className={cn("chip px-3 py-1.5", form.分类 === c ? "bg-clay-500 text-white" : "bg-ink-50 text-ink-500 hover:bg-ink-100")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">日期</label>
                <input type="date" value={formatDate(form.日期)} onChange={(e) => setForm({ ...form, 日期: new Date(e.target.value).getTime() })} className="input" />
              </div>
              <div>
                <label className="label">备注</label>
                <input value={form.备注 || ""} onChange={(e) => setForm({ ...form, 备注: e.target.value })} className="input" placeholder="可选" />
              </div>
              <button onClick={handleSave} className="btn-primary w-full py-3">
                {editingId ? "保存修改" : "确认记录"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
