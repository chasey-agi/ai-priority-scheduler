"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, XCircle, LogOut, User, Plus, Filter, BarChart3, Target, TrendingUp, Calendar } from "lucide-react";
import { DBTask, priNumToCh } from "@/lib/utils";
import TaskForm from "@/components/tasks/TaskForm";
import EnhancedTaskTable from "@/components/tasks/EnhancedTaskTable";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";
import BatchToolbar from "@/components/tasks/BatchToolbar";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import { Filters } from "@/components/tasks/TaskFilters";
import { useTasks } from "@/lib/hooks/useTasks";
import { useAuth, signOut } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Tasks(){
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { tasks, isLoading, addTask: createTask, updateTask, deleteTask, toggleStatus, batchComplete, batchDelete, batchSetPriority } = useTasks("all");
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-600 rounded-lg shadow-sm">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    任务管理
                  </h1>
                  <p className="text-slate-600 mt-1">智能管理您的任务，提升工作效率</p>
                </div>
              </div>
            </div>
          </div>
        

        </div>

      {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">总任务</p>
                  <p className="text-3xl font-bold text-slate-800">{taskStats.total}</p>
                  <p className="text-xs text-slate-500 mt-1">全部任务数量</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Target className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">待完成</p>
                  <p className="text-3xl font-bold text-slate-800">{taskStats.pending}</p>
                  <p className="text-xs text-slate-500 mt-1">需要处理的任务</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Clock className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">已完成</p>
                  <p className="text-3xl font-bold text-slate-800">{taskStats.completed}</p>
                  <p className="text-xs text-slate-500 mt-1">完成的任务</p>
                </div>
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10 opacity-20"></div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">完成率</p>
                  <p className="text-3xl font-bold text-slate-800">{taskStats.completionRate}%</p>
                  <div className="mt-2">
                    <Progress value={taskStats.completionRate} className="h-2" />
                  </div>
                </div>
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-100 rounded-full -mr-10 -mt-10 opacity-20"></div>
            </CardContent>
          </Card>
        </div>

      {/* Main Content Area */}
        <div className="w-full">
          {/* Task List Panel */}
          <div className="w-full">
            <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <BarChart3 className="h-5 w-5 text-slate-500" />
                    任务列表
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                      {filteredTasks.length} 项任务
                    </Badge>
                    <AddTaskDialog
                      onSubmit={createTask}
                      categories={categories}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
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
                <EnhancedTaskTable 
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
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                />
              </TabsContent>
            </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        <EditTaskDialog task={editing} onClose={()=> setEditing(null)} onSave={saveEdit} />
      </div>
    </div>
  );
}

