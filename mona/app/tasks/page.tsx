"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, LogOut, User } from "lucide-react";
import { DBTask, priNumToCh } from "@/lib/utils";
import TaskForm from "@/components/tasks/TaskForm";
import TaskTable from "@/components/tasks/TaskTable";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";
import BatchToolbar from "@/components/tasks/BatchToolbar";
import TaskFilters, { Filters } from "@/components/tasks/TaskFilters";
import { useTasks } from "@/lib/hooks/useTasks";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function Tasks(){
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tasks, isLoading, addTask, updateTask, deleteTask, toggleStatus, batchComplete, batchDelete, batchSetPriority } = useTasks("all");
  const [filters, setFilters] = useState<Filters>({ tab: "all", sort: "combined", date: "all", category: "全部", priority: "全部", keyword: "" });
  const [selectedTasks,setSelectedTasks]=useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<DBTask | null>(null);

  // 任务统计
  const taskStats = useMemo(() => {
    const pending = tasks.filter(t => t.status === "pending");
    const completed = tasks.filter(t => t.status === "completed");
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    return { total, pending: pending.length, completed: completed.length, completionRate };
  }, [tasks]);

  // 分类集合
  const categories = useMemo(()=> Array.from(new Set(tasks.map(t=> t.category || "其他"))), [tasks]);

  // 过滤 + 排序
  const filteredTasks = useMemo(() => {
    const tab = filters.tab; let arr = tasks.filter(t => tab === "all" ? true : (tab === "pending" ? t.status === "pending" : t.status === "completed"));
    const today = new Date(); const day0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (filters.date === "today") arr = arr.filter(t => t.deadline && new Date(t.deadline) >= day0 && new Date(t.deadline) < new Date(day0.getFullYear(), day0.getMonth(), day0.getDate()+1));
    if (filters.date === "overdue") arr = arr.filter(t => t.status !== "completed" && t.deadline && new Date(t.deadline) < day0);
    if (filters.date === "upcoming") arr = arr.filter(t => t.deadline && new Date(t.deadline) > day0);
    if (filters.date === "range") {
      const from = filters.from? new Date(filters.from): null; const to = filters.to? new Date(filters.to + "T23:59:59"): null;
      if (from && to) arr = arr.filter(t => t.deadline && new Date(t.deadline) >= from && new Date(t.deadline) <= to);
      else if (from) arr = arr.filter(t => t.deadline && new Date(t.deadline) >= from);
      else if (to) arr = arr.filter(t => t.deadline && new Date(t.deadline) <= to);
    }
    if (filters.category !== "全部") arr = arr.filter(t => (t.category || "其他") === filters.category);
    if (filters.priority !== "全部") arr = arr.filter(t => {
      const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
      return priNumToCh(priorityNum) === filters.priority;
    });
    if (filters.keyword) arr = arr.filter(t => t.content.toLowerCase().includes(filters.keyword.toLowerCase()));
    
    // 排序
    if (filters.sort === "priority") {
      arr.sort((a, b) => {
        const aPriority = typeof a.priority === 'string' ? parseInt(a.priority) || 1 : a.priority;
        const bPriority = typeof b.priority === 'string' ? parseInt(b.priority) || 1 : b.priority;
        return bPriority - aPriority;
      });
    }
    else if (filters.sort === "deadline") arr.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    // Remove the "created" sort option as it's not defined in Filters type
    else if (filters.sort === "combined") {
      arr.sort((a, b) => {
        const aPriority = typeof a.priority === 'string' ? parseInt(a.priority) || 1 : a.priority;
        const bPriority = typeof b.priority === 'string' ? parseInt(b.priority) || 1 : b.priority;
        const aScore = aPriority * 10 + (a.deadline ? Math.max(0, 10 - Math.floor((new Date(a.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0);
        const bScore = bPriority * 10 + (b.deadline ? Math.max(0, 10 - Math.floor((new Date(b.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0);
        return bScore - aScore;
      });
    }
    return arr;
  }, [tasks, filters]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }



  const toggle = async (id: string, checked: boolean|string) => { await toggleStatus(id, Boolean(checked)); };
  const openEdit = (t: DBTask) => setEditing(t);
  const saveEdit = async (id: string, patch: any) => { await updateTask(id, patch); };
  const del = async(id:string)=>{ await deleteTask(id); };
  const selectAllTasks = () => { setSelectedTasks(new Set(filteredTasks.map(t => t.id))); };
  const clearSelection = () => { setSelectedTasks(new Set()); };
  const doBatchComplete = async ()=> { if (selectedTasks.size) { await batchComplete(Array.from(selectedTasks)); clearSelection(); } };
  const doBatchDelete = async ()=> { if (selectedTasks.size) { await batchDelete(Array.from(selectedTasks)); clearSelection(); } };
  const doBatchSetHigh = async ()=> { if (selectedTasks.size) { await batchSetPriority(Array.from(selectedTasks), 5); clearSelection(); } };
  const quickSetPriority = async (taskId: string, priority: number) => { await updateTask(taskId, { priority } as any); };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6">
      {/* Header with user info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">任务管理</h1>
          <p className="text-sm text-muted-foreground mt-1">查看与管理所有任务，支持快速编辑、筛选与排序。</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            登出
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex justify-end">
        <TaskFilters value={filters} onChange={setFilters} categories={categories} />
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">总任务</p>
                <p className="text-2xl font-bold">{taskStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <XCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">待完成</p>
                <p className="text-2xl font-bold">{taskStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="h-4 w-4 text-purple-600 font-bold text-xs flex items-center justify-center">%</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">完成率</p>
                <p className="text-2xl font-bold">{taskStats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>新建任务</CardTitle></CardHeader>
          <CardContent>
            <TaskForm onSubmit={addTask} categories={categories.length? categories: ["工作","学习","生活","其他"]} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>任务列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filters.tab} onValueChange={(v:any)=>setFilters({ ...filters, tab: v })} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> 全部 ({taskStats.total})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> 待完成 ({taskStats.pending})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> 已完成 ({taskStats.completed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={filters.tab} className="mt-4">
                <BatchToolbar 
                  selectedCount={selectedTasks.size}
                  onComplete={doBatchComplete}
                  onDelete={doBatchDelete}
                  onSetHigh={doBatchSetHigh}
                  onClear={clearSelection}
                />
                <div className="mt-2" />
                <TaskTable 
                  tasks={filteredTasks}
                  isLoading={isLoading}
                  enableSelection
                  selectedIds={selectedTasks}
                  onToggleSelect={(id)=>{
                    const s = new Set(selectedTasks); s.has(id)? s.delete(id): s.add(id); setSelectedTasks(s);
                  }}
                  onToggleSelectAll={(ck)=> ck? selectAllTasks(): clearSelection()}
                  onToggleStatus={toggle}
                  onQuickPriority={quickSetPriority}
                  onEdit={(t)=> openEdit(t)}
                  onDelete={(id)=> del(id)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <EditTaskDialog task={editing} onClose={()=> setEditing(null)} onSave={saveEdit} />
    </div>
  );
}

