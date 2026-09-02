"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";

export function RetryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleRetry = async () => {
    setLoading(true);
    try {
      await onRetry();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <p className="text-ink-700 font-medium">数据加载失败</p>
      <p className="text-sm text-ink-400 mt-1 max-w-sm">{message}</p>
      <button onClick={handleRetry} disabled={loading} className="btn-outline mt-4">
        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        {loading ? "重试中…" : "重试"}
      </button>
    </div>
  );
}
