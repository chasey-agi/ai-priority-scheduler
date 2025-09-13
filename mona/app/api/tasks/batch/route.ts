import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from '@/lib/supabase-server';

type Action = "complete" | "delete" | "setPriority" | "setStatus";

// Get authenticated user
async function getUser() {
  const supabase = await createServerComponentClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    const supabase = await createServerComponentClient()
    
    const body = await req.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const action: Action = body.action;
    if (!ids.length || !action) {
      return NextResponse.json({ error: { code: "INVALID_BODY", message: "缺少 ids 或 action" } }, { status: 400 });
    }

    if (action === "delete") {
      const { error, count } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id)
        .in('id', ids)
      
      if (error) throw error
      return NextResponse.json({ ok: true, deleted: count });
    }

    if (action === "complete") {
      const { error, count } = await supabase
        .from('tasks')
        .update({ status: "completed" })
        .eq('user_id', user.id)
        .in('id', ids)
      
      if (error) throw error
      return NextResponse.json({ ok: true, updated: count });
    }

    if (action === "setPriority") {
      const priority = Number(body.priority);
      if (![1,3,5].includes(priority)) {
        return NextResponse.json({ error: { code: "INVALID_PRIORITY", message: "priority 必须为 1/3/5" } }, { status: 400 });
      }
      const { error, count } = await supabase
        .from('tasks')
        .update({ priority: String(priority) })
        .eq('user_id', user.id)
        .in('id', ids)
      
      if (error) throw error
      return NextResponse.json({ ok: true, updated: count });
    }

    if (action === "setStatus") {
      const statusRaw = String(body.status || "pending");
      const status = statusRaw === "completed" || statusRaw === "done" ? "completed" : "pending";
      const { error, count } = await supabase
        .from('tasks')
        .update({ status })
        .eq('user_id', user.id)
        .in('id', ids)
      
      if (error) throw error
      return NextResponse.json({ ok: true, updated: count });
    }

    return NextResponse.json({ error: { code: "UNSUPPORTED_ACTION", message: `不支持的 action: ${action}` } }, { status: 400 });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "未授权访问" } }, { status: 401 })
    }
    return NextResponse.json({ error: { code: "BATCH_FAILED", message: "批量操作失败" } }, { status: 500 });
  }
}

