import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from '@/lib/supabase-server';

// 将 Date 转成 YYYY-MM-DD 字符串（本地时区）
function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    
    const url = new URL(req.url);
    const includeNoDeadlineRaw = url.searchParams.get("includeNoDeadline");
    const includeNoDeadline = includeNoDeadlineRaw === "1" || includeNoDeadlineRaw === "true";

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)

    if (includeNoDeadline) {
      query = query.or(`deadline.gte.${start.toISOString()},deadline.lt.${end.toISOString()},deadline.is.null`)
    } else {
      query = query.gte('deadline', start.toISOString()).lt('deadline', end.toISOString())
    }

    const { data: tasks, error } = await query.order('priority', { ascending: false })
      .order('deadline', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    const mapped = tasks.map((t) => ({
      ...t,
      // 将 Date 序列化为 YYYY-MM-DD 字符串（前端用 <input type="date"/> 可直接使用）
      deadline: t.deadline ? ymd(new Date(t.deadline)) : null,
    }));

    return NextResponse.json({ tasks: mapped });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "未授权访问" } }, { status: 401 })
    }
    return NextResponse.json({ error: { code: "GET_TODAY_TASKS_FAILED", message: "获取今日任务失败" } }, { status: 500 });
  }
}