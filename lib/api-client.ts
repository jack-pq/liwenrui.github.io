export type TableName =
  | "finance"
  | "habit"
  | "habit_log"
  | "fitness"
  | "schedule"
  | "shopping"
  | "collection";

export interface ApiRecord {
  record_id: string;
  fields: Record<string, any>;
}

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string = "UNKNOWN") {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

async function call(body: any): Promise<any> {
  const res = await fetch("/api/feishu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.error || "请求失败", data.code || "UNKNOWN");
  }
  return data;
}

export async function listRecords(
  table: TableName,
  options?: { sort?: Array<{ field_name: string; desc?: boolean }> }
): Promise<ApiRecord[]> {
  const data = await call({ table, action: "list", options });
  return data.records;
}

export async function searchRecords(
  table: TableName,
  filter?: any,
  sort?: Array<{ field_name: string; desc?: boolean }>
): Promise<ApiRecord[]> {
  const data = await call({ table, action: "search", filter, sort });
  return data.records;
}

export async function createRecord(
  table: TableName,
  fields: Record<string, any>
): Promise<ApiRecord> {
  const data = await call({ table, action: "create", fields });
  return data.record;
}

export async function updateRecord(
  table: TableName,
  recordId: string,
  fields: Record<string, any>
): Promise<ApiRecord> {
  const data = await call({ table, action: "update", recordId, fields });
  return data.record;
}

export async function deleteRecord(
  table: TableName,
  recordId: string
): Promise<void> {
  await call({ table, action: "delete", recordId });
}
