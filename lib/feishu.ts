const FEISHU_HOST = "https://open.feishu.cn";

let tokenCache: { token: string; expireAt: number } | null = null;

function getCredentials() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const baseToken = process.env.FEISHU_BASE_TOKEN;
  if (!appId || !appSecret || !baseToken) {
    throw new FeishuError(
      "缺少飞书凭证（FEISHU_APP_ID / FEISHU_APP_SECRET / FEISHU_BASE_TOKEN），请在 .env.local 中配置",
      "CONFIG_MISSING"
    );
  }
  return { appId, appSecret, baseToken };
}

export class FeishuError extends Error {
  code: string;
  constructor(message: string, code: string = "UNKNOWN") {
    super(message);
    this.code = code;
    this.name = "FeishuError";
  }
}

async function getTenantAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expireAt > now + 60_000) {
    return tokenCache.token;
  }
  const { appId, appSecret } = getCredentials();
  const res = await fetch(
    `${FEISHU_HOST}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    }
  );
  const data = await res.json();
  if (data.code !== 0) {
    throw new FeishuError(
      `获取飞书 token 失败: ${data.msg || "未知错误"}`,
      "TOKEN_FAILED"
    );
  }
  tokenCache = {
    token: data.tenant_access_token,
    expireAt: now + (data.expire || 7200) * 1000,
  };
  return tokenCache.token;
}

export function getTableId(key: string): string {
  const id = process.env[key];
  if (!id) {
    throw new FeishuError(
      `数据表未配置: ${key}，请在 .env.local 中填写对应的 Table ID`,
      "TABLE_MISSING"
    );
  }
  return id;
}

type RawField = any;

export function normalizeField(value: RawField): any {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const first = value[0];
    if (first && typeof first === "object" && "text" in first) {
      return value.map((v: any) => v.text).join("");
    }
    if (typeof first === "string") return first;
    return value;
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("link" in value) return value.link;
    return value;
  }
  return value;
}

export function normalizeFields(fields: Record<string, RawField>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = normalizeField(v);
  }
  return out;
}

export function denormalizeField(value: any): RawField {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return [{ type: "text", text: value }];
  return value;
}

const fieldTypeCache: Record<string, Record<string, number>> = {};

export async function getTableFieldTypes(tableId: string): Promise<Record<string, number>> {
  if (fieldTypeCache[tableId]) return fieldTypeCache[tableId];
  const { baseToken } = getCredentials();
  try {
    const data = await feishuFetch(
      `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/fields`
    );
    const map: Record<string, number> = {};
    for (const f of data.items || []) {
      map[f.field_name] = f.type;
    }
    fieldTypeCache[tableId] = map;
    return map;
  } catch {
    return {};
  }
}

export function denormalizeFieldsByType(
  fields: Record<string, any>,
  types: Record<string, number>
): Record<string, RawField> {
  const out: Record<string, RawField> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) {
      out[k] = null;
      continue;
    }
    const type = types[k];
    if (type === 15 && typeof v === "string") {
      out[k] = v ? { link: v, text: v } : null;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function denormalizeFields(fields: Record<string, any>): Record<string, RawField> {
  const out: Record<string, RawField> = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = denormalizeField(v);
  }
  return out;
}

export interface FeishuRecord {
  record_id: string;
  fields: Record<string, any>;
  created_time?: number;
  last_modified_time?: number;
}

interface SearchParams {
  tableId: string;
  filter?: {
    conjunction?: "and" | "or";
    conditions: Array<{
      field_name: string;
      operator: string;
      value: any[];
    }>;
  };
  sort?: Array<{ field_name: string; desc?: boolean }>;
  pageSize?: number;
  pageToken?: string;
}

async function feishuFetch(path: string, init: RequestInit = {}): Promise<any> {
  const token = await getTenantAccessToken();
  const res = await fetch(`${FEISHU_HOST}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (res.status === 429) {
    throw new FeishuError("飞书 API 请求过于频繁，请稍后重试", "RATE_LIMIT");
  }
  const data = await res.json();
  if (data.code !== 0) {
    throw new FeishuError(
      `飞书 API 错误: ${data.msg || "未知错误"} (code: ${data.code})`,
      "API_ERROR"
    );
  }
  return data.data;
}

export async function listRecords(
  tableId: string,
  opts: { sort?: Array<{ field_name: string; desc?: boolean }> } = {}
): Promise<FeishuRecord[]> {
  const { baseToken } = getCredentials();
  const all: FeishuRecord[] = [];
  let pageToken: string | undefined;
  do {
    const body: any = { page_size: 500 };
    if (opts.sort) body.sort = opts.sort;
    if (pageToken) body.page_token = pageToken;
    const data = await feishuFetch(
      `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/search?page_size=500${
        pageToken ? `&page_token=${pageToken}` : ""
      }`,
      { method: "POST", body: JSON.stringify(body) }
    );
    const items = data.items || [];
    for (const item of items) {
      all.push({
        record_id: item.record_id,
        fields: normalizeFields(item.fields),
        created_time: item.created_time,
        last_modified_time: item.last_modified_time,
      });
    }
    pageToken = data.page_token;
  } while (pageToken);
  return all;
}

export async function searchRecords(params: SearchParams): Promise<FeishuRecord[]> {
  const { baseToken } = getCredentials();
  const all: FeishuRecord[] = [];
  let pageToken: string | undefined;
  do {
    const body: any = {
      page_size: params.pageSize || 500,
    };
    if (params.filter) body.filter = params.filter;
    if (params.sort) body.sort = params.sort;
    if (pageToken) body.page_token = pageToken;
    const data = await feishuFetch(
      `/open-apis/bitable/v1/apps/${baseToken}/tables/${params.tableId}/records/search?page_size=${
        params.pageSize || 500
      }${pageToken ? `&page_token=${pageToken}` : ""}`,
      { method: "POST", body: JSON.stringify(body) }
    );
    const items = data.items || [];
    for (const item of items) {
      all.push({
        record_id: item.record_id,
        fields: normalizeFields(item.fields),
        created_time: item.created_time,
        last_modified_time: item.last_modified_time,
      });
    }
    pageToken = data.page_token;
  } while (pageToken);
  return all;
}

export async function createRecord(
  tableId: string,
  fields: Record<string, any>
): Promise<FeishuRecord> {
  const { baseToken } = getCredentials();
  const types = await getTableFieldTypes(tableId);
  const data = await feishuFetch(
    `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records`,
    {
      method: "POST",
      body: JSON.stringify({ fields: denormalizeFieldsByType(fields, types) }),
    }
  );
  return {
    record_id: data.record.record_id,
    fields: normalizeFields(data.record.fields),
  };
}

export async function updateRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, any>
): Promise<FeishuRecord> {
  const { baseToken } = getCredentials();
  const types = await getTableFieldTypes(tableId);
  const data = await feishuFetch(
    `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`,
    {
      method: "PUT",
      body: JSON.stringify({ fields: denormalizeFieldsByType(fields, types) }),
    }
  );
  return {
    record_id: data.record.record_id,
    fields: normalizeFields(data.record.fields),
  };
}

export async function deleteRecord(
  tableId: string,
  recordId: string
): Promise<void> {
  const { baseToken } = getCredentials();
  await feishuFetch(
    `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/${recordId}`,
    { method: "DELETE" }
  );
}

export async function batchCreateRecords(
  tableId: string,
  records: Record<string, any>[]
): Promise<FeishuRecord[]> {
  const { baseToken } = getCredentials();
  const types = await getTableFieldTypes(tableId);
  const results: FeishuRecord[] = [];
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500);
    const data = await feishuFetch(
      `/open-apis/bitable/v1/apps/${baseToken}/tables/${tableId}/records/batch_create`,
      {
        method: "POST",
        body: JSON.stringify({
          records: chunk.map((f) => ({ fields: denormalizeFieldsByType(f, types) })),
        }),
      }
    );
    for (const r of data.records) {
      results.push({
        record_id: r.record_id,
        fields: normalizeFields(r.fields),
      });
    }
  }
  return results;
}
