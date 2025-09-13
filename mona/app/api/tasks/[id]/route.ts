import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'

// Priority mapping
const priorityMap = {
  'low': 1,
  'medium': 2,
  'high': 3,
  'urgent': 4
}

// Status mapping
const statusMap = {
  'pending': 'pending',
  'in-progress': 'in-progress',
  'completed': 'completed'
}

// Convert date string to Date object
function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

// Get authenticated user
async function getUser() {
  const supabase = await createServerComponentClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    const { id } = await params;
    const body = await req.json();
    const supabase = await createServerComponentClient()
    const data: any = {};

    if (typeof body.status === "string") {
      data.status = statusMap[body.status as keyof typeof statusMap] || body.status
    }
    if (typeof body.content === "string") data.content = body.content;
    if (typeof body.category === "string") data.category = body.category;
    if (typeof body.priority === "string" || typeof body.priority === "number") {
      data.priority = typeof body.priority === "number" ? body.priority : priorityMap[body.priority as keyof typeof priorityMap] || 2
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
    const user = await getUser()
    const { id } = await params;
    const supabase = await createServerComponentClient()
    
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