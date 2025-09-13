import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Action = "complete" | "delete" | "setPriority" | "setStatus";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const action: Action = body.action;
    if (!ids.length || !action) {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "缺少 ids 或 action" } }, { status: 400 });
    }

    if (action === "delete") {
      const result = await prisma.task.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ ok: true, deleted: result.count });
    }

    if (action === "complete") {
      const result = await prisma.task.updateMany({ where: { id: { in: ids } }, data: { status: "completed" } });
      return NextResponse.json({ ok: true, updated: result.count });
    }

    if (action === "setPriority") {
      const priority = Number(body.priority);
      if (![1,3,5].includes(priority)) {
        return NextResponse.json({ error: { code: "INVALID_PRIORITY", message: "priority 必须为 1/3/5" } }, { status: 400 });
      }
      const result = await prisma.task.updateMany({ where: { id: { in: ids } }, data: { priority: String(priority) } });
      return NextResponse.json({ ok: true, updated: result.count });
    }

    if (action === "setStatus") {
      const statusRaw = String(body.status || "pending");
      const status = statusRaw === "completed" || statusRaw === "done" ? "completed" : "pending";
      const result = await prisma.task.updateMany({ where: { id: { in: ids } }, data: { status } });
      return NextResponse.json({ ok: true, updated: result.count });
    }

    return NextResponse.json({ error: { code: "UNSUPPORTED_ACTION", message: `不支持的 action: ${action}` } }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: { code: "BATCH_FAILED", message: "批量操作失败" } }, { status: 500 });
  }
}

