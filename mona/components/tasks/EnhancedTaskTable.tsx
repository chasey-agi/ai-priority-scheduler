"use client";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Clock, AlertCircle, Search, Filter } from "lucide-react";
import { DBTask, priNumToCh } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Filters } from "./TaskFilters";

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
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categories: string[];
};

export default function EnhancedTaskTable({ 
  tasks, 
  isLoading, 
  enableSelection, 
  selectedIds, 
  onToggleSelect, 
  onToggleSelectAll, 
  onToggleStatus, 
  onQuickPriority, 
  onEdit, 
  onDelete,
  filters,
  onFiltersChange,
  categories
}: Props) {
  const [showFilters, setShowFilters] = useState(false);
  
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

  const withChange = (patch: Partial<Filters>) => onFiltersChange({ ...filters, ...patch });
  const categoryOptions = useMemo(() => ["全部", ...categories], [categories]);

  return (
    <div className="space-y-4">
      {/* 搜索和筛选控制栏 */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="搜索任务内容..." 
              value={filters.keyword} 
              onChange={e => withChange({ keyword: e.target.value })} 
              className="pl-10"
            />
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          筛选
        </Button>
      </div>

      {/* 筛选选项 */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          <Select value={filters.sort} onValueChange={(v: any) => withChange({ sort: v })}>
            <SelectTrigger>
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="combined">综合（优先级优先）</SelectItem>
              <SelectItem value="deadline">按截止日期</SelectItem>
              <SelectItem value="priority">按优先级</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.date} onValueChange={(v: any) => withChange({ date: v })}>
            <SelectTrigger>
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部日期</SelectItem>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="overdue">逾期</SelectItem>
              <SelectItem value="upcoming">将来</SelectItem>
              <SelectItem value="range">自定义区间</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.category} onValueChange={(v: any) => withChange({ category: v })}>
            <SelectTrigger>
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(v: any) => withChange({ priority: v })}>
            <SelectTrigger>
              <SelectValue placeholder="优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部</SelectItem>
              <SelectItem value="高">高</SelectItem>
              <SelectItem value="中">中</SelectItem>
              <SelectItem value="低">低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 日期范围选择 */}
      {filters.date === "range" && (
        <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border">
          <Input 
            type="date" 
            value={filters.from || ""} 
            onChange={e => withChange({ from: e.target.value })} 
            className="w-[150px]" 
          />
          <span className="self-center text-gray-500">至</span>
          <Input 
            type="date" 
            value={filters.to || ""} 
            onChange={e => withChange({ to: e.target.value })} 
            className="w-[150px]" 
          />
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-lg border-0 shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200">
              {enableSelection && (
                <TableHead className="w-12 pl-4">
                  <Checkbox 
                    checked={!!selectedIds && selectedIds.size === tasks.length && tasks.length > 0}
                    onCheckedChange={(checked) => onToggleSelectAll && onToggleSelectAll(Boolean(checked))}
                    aria-label={selectedIds && selectedIds.size > 0 ? "取消全选当前页面任务" : "全选当前页面任务"}
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
            {isLoading ? (
              <>
                <TableRow><TableCell colSpan={enableSelection ? 7 : 6} className="py-4"><div className="h-4 rounded bg-gray-200 animate-pulse" /></TableCell></TableRow>
                <TableRow><TableCell colSpan={enableSelection ? 7 : 6} className="py-4"><div className="h-4 rounded bg-gray-200 animate-pulse" /></TableCell></TableRow>
                <TableRow><TableCell colSpan={enableSelection ? 7 : 6} className="py-4"><div className="h-4 rounded bg-gray-200 animate-pulse" /></TableCell></TableRow>
              </>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={enableSelection ? 7 : 6} className="text-center text-gray-500 py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="h-8 w-8 text-gray-400" />
                    <span className="text-sm">暂无任务</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (tasks.map(t => {
              const isDone = t.status === "completed";
              const [first, ...rest] = t.content.split(/\n|——|—|--/);
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
                        onCheckedChange={() => onToggleSelect && onToggleSelect(t.id)} 
                        aria-label={`选择任务：${first}`}
                        className="border-gray-300"
                      />
                    </TableCell>
                  )}
                  <TableCell className="align-middle">
                    <Checkbox 
                      checked={isDone} 
                      onCheckedChange={c => onToggleStatus(t.id, Boolean(c))} 
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
                            onClick={() => onQuickPriority(t.id, Math.min(5, priorityNum + 2))}
                            disabled={priorityNum >= 5}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 p-0 hover:bg-gray-100" 
                            aria-label="降低优先级" 
                            onClick={() => onQuickPriority(t.id, Math.max(1, priorityNum - 2))}
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
                        onClick={() => onEdit(t)} 
                        aria-label={`编辑任务：${first}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-red-100 hover:text-red-600" 
                        onClick={() => onDelete(t.id)} 
                        aria-label={`删除任务：${first}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}