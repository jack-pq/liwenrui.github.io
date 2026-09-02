import { NextRequest, NextResponse } from "next/server";
import {
  listRecords,
  searchRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  getTableId,
  FeishuError,
} from "@/lib/feishu";

const TABLE_KEY_MAP: Record<string, string> = {
  finance: "FEISHU_TABLE_FINANCE",
  habit: "FEISHU_TABLE_HABIT",
  habit_log: "FEISHU_TABLE_HABIT_LOG",
  fitness: "FEISHU_TABLE_FITNESS",
  schedule: "FEISHU_TABLE_SCHEDULE",
  shopping: "FEISHU_TABLE_SHOPPING",
  collection: "FEISHU_TABLE_COLLECTION",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, action } = body;

    if (!table || !TABLE_KEY_MAP[table]) {
      return NextResponse.json(
        { error: `未知的数据表: ${table}`, code: "INVALID_TABLE" },
        { status: 400 }
      );
    }

    const tableId = getTableId(TABLE_KEY_MAP[table]);

    switch (action) {
      case "list": {
        const records = await listRecords(tableId, body.options || {});
        return NextResponse.json({ records });
      }
      case "search": {
        const records = await searchRecords({
          tableId,
          filter: body.filter,
          sort: body.sort,
        });
        return NextResponse.json({ records });
      }
      case "create": {
        const record = await createRecord(tableId, body.fields);
        return NextResponse.json({ record });
      }
      case "update": {
        const record = await updateRecord(tableId, body.recordId, body.fields);
        return NextResponse.json({ record });
      }
      case "delete": {
        await deleteRecord(tableId, body.recordId);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json(
          { error: `未知的操作: ${action}`, code: "INVALID_ACTION" },
          { status: 400 }
        );
    }
  } catch (err) {
    const isFeishuErr = err instanceof FeishuError;
    const message = isFeishuErr ? err.message : "服务器内部错误";
    const code = isFeishuErr ? err.code : "INTERNAL";
    const status =
      code === "CONFIG_MISSING" || code === "TABLE_MISSING" ? 503 : 500;
    return NextResponse.json({ error: message, code }, { status });
  }
}
