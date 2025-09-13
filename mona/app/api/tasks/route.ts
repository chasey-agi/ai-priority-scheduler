import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'
import { z } from 'zod'

// Priority mapping
const priorityMap = {
  'low': 1,
  'medium': 2,
  'high': 3,
  'urgent': 4
}

const reversePriorityMap = {
  1: 'low',
  2: 'medium', 
  3: 'high',
  4: 'urgent'
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

export async function GET() {
  try {
    const user = await getUser()
    const supabase = await createServerComponentClient()
    
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ tasks })
  } catch (e) {
    console.error(e)
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "未授权访问" } }, { status: 401 })
    }
    return NextResponse.json({ error: { code: "GET_TASKS_FAILED", message: "获取任务失败" } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = await createServerComponentClient()
    
    const body = await request.json()
    const { content, category = "其他", priority, deadline, status } = body ?? {}
    
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: { code: "INVALID_CONTENT", message: "content 为必填字符串" } }, { status: 400 })
    }

    // Handle priority - can be either string or number
    let priorityValue = 2; // default to medium
    if (typeof priority === 'string') {
      priorityValue = priorityMap[priority as keyof typeof priorityMap] || 2;
    } else if (typeof priority === 'number') {
      priorityValue = priority;
    }

    const { data: created, error } = await supabase
      .from('tasks')
      .insert({
        content,
        category: String(category),
        priority: priorityValue,
        status: statusMap[status as keyof typeof statusMap] || 'pending',
        deadline: parseDate(deadline),
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }

    return NextResponse.json({ task: created }, { status: 201 })
  } catch (e) {
    console.error(e)
    if (e instanceof Error && e.message === 'Unauthorized') {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "未授权访问" } }, { status: 401 })
    }
    return NextResponse.json({ error: { code: "CREATE_TASK_FAILED", message: "创建任务失败" } }, { status: 500 })
  }
}