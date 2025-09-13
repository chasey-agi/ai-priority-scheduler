"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";
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
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {enableSelection && (
              <TableHead className="w-10">
                <Checkbox 
                  checked={!!selectedIds && selectedIds.size === tasks.length && tasks.length > 0}
                  onCheckedChange={(checked)=> onToggleSelectAll && onToggleSelectAll(Boolean(checked))}
                  aria-label={selectedIds && selectedIds.size>0 ? "取消全选当前页面任务" : "全选当前页面任务"}
                />
              </TableHead>
            )}
            <TableHead className="w-10">完成</TableHead>
            <TableHead>任务</TableHead>
            <TableHead className="hidden sm:table-cell">分类</TableHead>
            <TableHead className="hidden sm:table-cell">截止</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead className="w-28">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading? (
            <>
              <TableRow><TableCell colSpan={enableSelection? 7:6} className="py-3"><div className="h-4 rounded bg-muted animate-pulse"/></TableCell></TableRow>
              <TableRow><TableCell colSpan={enableSelection? 7:6} className="py-3"><div className="h-4 rounded bg-muted animate-pulse"/></TableCell></TableRow>
              <TableRow><TableCell colSpan={enableSelection? 7:6} className="py-3"><div className="h-4 rounded bg-muted animate-pulse"/></TableCell></TableRow>
            </>
          ): tasks.length===0? (
            <TableRow><TableCell colSpan={enableSelection? 7:6} className="text-center text-muted-foreground py-8">暂无任务</TableCell></TableRow>
          ):(tasks.map(t=> {
            const isDone = t.status === "completed";
            const [first,...rest]=t.content.split(/\n|——|—|--/);
            const second = rest.join(" ").trim();
            return (
              <TableRow key={t.id} className={cn(enableSelection && selectedIds?.has(t.id) && "bg-muted/50")}>
                {enableSelection && (
                  <TableCell className="align-middle">
                    <Checkbox 
                      checked={!!selectedIds?.has(t.id)} 
                      onCheckedChange={()=> onToggleSelect && onToggleSelect(t.id)} 
                      aria-label={`选择任务：${first}`}
                    />
                  </TableCell>
                )}
                <TableCell className="align-middle"><Checkbox checked={isDone} onCheckedChange={c=>onToggleStatus(t.id, Boolean(c))} aria-label={`标记任务${isDone ? '未完成' : '已完成'}：${first}`} /></TableCell>
                <TableCell className="align-middle">
                  <div className={cn("font-medium leading-tight break-words", isDone && "line-through text-muted-foreground")}>{first}</div>
                  {second? <div className={cn("text-xs mt-1", isDone? "text-muted-foreground line-through":"text-muted-foreground line-clamp-2")}>{second}</div>:null}
                </TableCell>
                <TableCell className="align-middle hidden sm:table-cell"><Badge variant="outline">{t.category}</Badge></TableCell>
                <TableCell className="align-middle hidden sm:table-cell">{t.deadline || <span className="text-muted-foreground">未设置</span>}</TableCell>
                <TableCell className="align-middle">
                  <div className="flex items-center gap-1">
                    <Badge variant={(() => {
                      const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
                      return priorityNum >= 4 ? "destructive" : priorityNum >= 2 ? "default" : "secondary";
                    })()}>{priNumToCh(typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority)}</Badge>
                    {onQuickPriority && (
                      <div className="flex flex-col">
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" aria-label="提高优先级" onClick={()=> {
                          const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
                          onQuickPriority(t.id, Math.min(5, priorityNum + 2));
                        }} disabled={(() => {
                          const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
                          return priorityNum >= 5;
                        })()}>
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0" aria-label="降低优先级" onClick={()=> {
                          const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
                          onQuickPriority(t.id, Math.max(1, priorityNum - 2));
                        }} disabled={(() => {
                          const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
                          return priorityNum <= 1;
                        })()}>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="align-middle">
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>onEdit(t)} aria-label={`编辑任务：${first}`}><Edit2 className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>onDelete(t.id)} aria-label={`删除任务：${first}`}><Trash2 className="h-4 w-4"/></Button>
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

