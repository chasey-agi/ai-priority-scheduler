"use client";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Filters = {
  tab: "all"|"pending"|"completed";
  sort: "combined"|"deadline"|"priority";
  date: "all"|"overdue"|"today"|"upcoming"|"range";
  from?: string;
  to?: string;
  category: string; // "全部" or specific
  priority: "全部"|"高"|"中"|"低";
  keyword: string;
};

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  categories: string[];
};

export default function TaskFilters({ value, onChange, categories }: Props) {
  const withChange = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const categoryOptions = useMemo(()=> ["全部", ...categories], [categories]);

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <Select value={value.sort} onValueChange={(v:any)=>withChange({ sort: v })}>
        <SelectTrigger className="min-w-[160px]"><SelectValue placeholder="排序方式"/></SelectTrigger>
        <SelectContent>
          <SelectItem value="combined">综合（优先级优先）</SelectItem>
          <SelectItem value="deadline">按截止日期</SelectItem>
          <SelectItem value="priority">按优先级</SelectItem>
        </SelectContent>
      </Select>

      <Select value={value.date} onValueChange={(v:any)=>withChange({ date: v })}>
        <SelectTrigger className="min-w-[140px]"><SelectValue placeholder="时间范围"/></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部日期</SelectItem>
          <SelectItem value="today">今天</SelectItem>
          <SelectItem value="overdue">逾期</SelectItem>
          <SelectItem value="upcoming">将来</SelectItem>
          <SelectItem value="range">自定义区间</SelectItem>
        </SelectContent>
      </Select>

      {value.date === "range" && (
        <>
          <Input type="date" value={value.from||""} onChange={e=>withChange({ from: e.target.value })} className="w-[150px]" />
          <Input type="date" value={value.to||""} onChange={e=>withChange({ to: e.target.value })} className="w-[150px]" />
        </>
      )}

      <Select value={value.category} onValueChange={(v:any)=>withChange({ category: v })}>
        <SelectTrigger className="min-w-[120px]"><SelectValue placeholder="分类"/></SelectTrigger>
        <SelectContent>
          {categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={value.priority} onValueChange={(v:any)=>withChange({ priority: v })}>
        <SelectTrigger className="min-w-[120px]"><SelectValue placeholder="优先级"/></SelectTrigger>
        <SelectContent>
          <SelectItem value="全部">全部</SelectItem>
          <SelectItem value="高">高</SelectItem>
          <SelectItem value="中">中</SelectItem>
          <SelectItem value="低">低</SelectItem>
        </SelectContent>
      </Select>

      <Input placeholder="关键词" value={value.keyword} onChange={e=>withChange({ keyword: e.target.value })} className="min-w-[200px]" />
      <div className="text-xs text-muted-foreground">全选仅作用当前筛选结果</div>
    </div>
  );
}

