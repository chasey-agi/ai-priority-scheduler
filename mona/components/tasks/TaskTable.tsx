"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";
import { DBTask, priNumToCh } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  tasks: DBTask[];
  isLoading?: boolean;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  onToggleStatus: (id: string, toCompleted: boolean) => void;
  onQuickPriority?: (id: string, newPriority: number) => void;
  onEdit: (task: DBTask) => void;
  onDelete: (id: string) => void;
};

export default function TaskTable({ tasks, isLoading, enableSelection, selectedIds, onToggleSelect, onToggleSelectAll, onToggleStatus, onQuickPriority, onEdit, onDelete }: Props) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "工作": return "💼";
      case "学习": return "📚";
      case "生活": return "🏠";
      case "其他": return "📝";
      default: return "📋";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return "bg-red-100 text-red-700 border-red-200";
    if (priority >= 2) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="rounded-lg border-0 shadow-sm bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 border-b border-gray-200">
            {enableSelection && (
              <TableHead className="w-12 pl-4">
                <Checkbox 
                  checked={!!selectedIds && selectedIds.size === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked)=> onToggleSelectAll && onToggleSelectAll(Boolean(checked))}
                  aria-label={selectedIds && selectedIds.size>0 ? "取消全选当前页面任务" : "全选当前页面任务"}
                  className="border-gray-300"
                />
              </TableHead>
            )}
            <TableHead className="w-12">状态</TableHead>
            <TableHead className="font-semibold text-gray-700">任务内容</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-gray-700">分类</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold text-gray-700">截止时间</TableHead>
            <TableHead className="font-semibold text-gray-700">优先级</TableHead>
            <TableHead className="w-32 font-semibold text-gray-700">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading? (
            <>
              <TableRow><TableCell colSpan={enableSelection? 7:6} className="py-4"><div className="h-4 rounded bg-gray-200 animate-pulse"/></TableCell></TableRow>
              <TableRow><TableCell colSpan={enableSelection? 7:6} className="py-4"><div className="h-4 rounded bg-gray-200 animate-pulse"/></TableCell></TableRow>
              <TableRow><TableCell colSpan={enableSelection? 7:6} className="py-4"><div className="h-4 rounded bg-gray-200 animate-pulse"/></TableCell></TableRow>
            </>
          ): tasks.length===0? (
            <TableRow>
              <TableCell colSpan={enableSelection? 7:6} className="text-center text-gray-500 py-12">
                <div className="flex flex-col items-center gap-2">
                  <Clock className="h-8 w-8 text-gray-400" />
                  <span className="text-sm">暂无任务</span>
                </div>
              </TableCell>
            </TableRow>
          ):(tasks.map(t=> {
            const isDone = t.status === "completed";
            const [first,...rest]=t.content.split(/\n|——|—|--/);
            const second = rest.join(" ").trim();
            const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
            const overdue = isOverdue(t.deadline);
            
            return (
              <TableRow 
                key={t.id} 
                className={cn(
                  "hover:bg-gray-50/80 transition-colors border-b border-gray-100",
                  enableSelection && selectedIds?.has(t.id) && "bg-blue-50/50",
                  isDone && "opacity-60"
                )}
              >
                {enableSelection && (
                  <TableCell className="align-middle pl-4">
                    <Checkbox 
                      checked={!!selectedIds?.has(t.id)} 
                      onCheckedChange={()=> onToggleSelect && onToggleSelect(t.id)} 
                      aria-label={`选择任务：${first}`}
                      className="border-gray-300"
                    />
                  </TableCell>
                )}
                <TableCell className="align-middle">
                  <Checkbox 
                    checked={isDone} 
                    onCheckedChange={c=>onToggleStatus(t.id, Boolean(c))} 
                    aria-label={`标记任务${isDone ? '未完成' : '已完成'}：${first}`}
                    className="border-gray-300"
                  />
                </TableCell>
                <TableCell className="align-middle py-4">
                  <div className={cn("font-medium leading-tight break-words text-gray-900", isDone && "line-through text-gray-500")}>
                    {first}
                  </div>
                  {second && (
                    <div className={cn("text-sm mt-1 text-gray-600", isDone && "line-through text-gray-400")}>
                      {second}
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-middle hidden sm:table-cell">
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <span>{getCategoryIcon(t.category)}</span>
                    <span>{t.category}</span>
                  </Badge>
                </TableCell>
                <TableCell className="align-middle hidden sm:table-cell">
                  {t.deadline ? (
                    <div className={cn("flex items-center gap-1 text-sm", overdue && "text-red-600")}>
                      {overdue && <AlertCircle className="h-4 w-4" />}
                      <Calendar className="h-4 w-4" />
                      <span>{t.deadline}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">未设置</span>
                  )}
                </TableCell>
                <TableCell className="align-middle">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(priorityNum)}>
                      {priNumToCh(priorityNum)}
                    </Badge>
                    {onQuickPriority && (
                      <div className="flex flex-col gap-0.5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 hover:bg-gray-100" 
                          aria-label="提高优先级" 
                          onClick={()=> onQuickPriority(t.id, Math.min(5, priorityNum + 2))}
                          disabled={priorityNum >= 5}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 hover:bg-gray-100" 
                          aria-label="降低优先级" 
                          onClick={()=> onQuickPriority(t.id, Math.max(1, priorityNum - 2))}
                          disabled={priorityNum <= 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600" 
                      onClick={()=>onEdit(t)} 
                      aria-label={`编辑任务：${first}`}
                    >
                      <Edit2 className="h-4 w-4"/>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-red-100 hover:text-red-600" 
                      onClick={()=>onDelete(t.id)} 
                      aria-label={`删除任务：${first}`}
                    >
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          }))}
        </TableBody>
      </Table>
    </div>
  );
}

