import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/supabase-server'

// Priority mapping - align to 1/3/5 steps
const priorityMap = {
  'low': 1,
  'medium': 3,
  'high': 5,
  'urgent': 5,
} as const

// Status mapping - normalize
const statusMap = {
  'pending': 'pending',
  'in-progress': 'pending',
  'completed': 'completed'
} as const

// Convert date string to Date object
function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    const { id } = await params;
    const body = await req.json();
    const data: any = {};

    if (typeof body.status === "string") {
      data.status = statusMap[body.status as keyof typeof statusMap] || 'pending'
    }
    if (typeof body.content === "string") data.content = body.content;
    if (typeof body.category === "string") data.category = body.category;
    if (typeof body.priority === "string" || typeof body.priority === "number") {
      const val = typeof body.priority === "number" ? body.priority : priorityMap[body.priority as keyof typeof priorityMap];
      data.priority = [1,3,5].includes(Number(val)) ? Number(val) : 3;
    }
    if (typeof body.deadline === "string") {
      data.deadline = parseDate(body.deadline)
    }

    const { data: updated, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ task: updated });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "未授权访问" } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "PATCH_TASK_FAILED", message: "更新任务失败" } }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase } = await getAuthenticatedUser()
    const { id } = await params;
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "未授权访问" } }, { status: 401 });
    }
    return NextResponse.json({ error: { code: "DELETE_TASK_FAILED", message: "删除任务失败" } }, { status: 500 });
  }
}