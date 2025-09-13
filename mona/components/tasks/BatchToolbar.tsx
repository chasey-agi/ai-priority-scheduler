"use client";
import { Button } from "@/components/ui/button";
import { CheckCircle, Trash2, ChevronUp, XCircle } from "lucide-react";

type Props = {
  selectedCount: number;
  onComplete: () => void;
  onDelete: () => void;
  onSetHigh: () => void;
  onClear: () => void;
};

export default function BatchToolbar({ selectedCount, onComplete, onDelete, onSetHigh, onClear }: Props) {
  if (selectedCount <= 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
      <span className="text-sm text-muted-foreground">已选择 {selectedCount} 项（仅当前筛选结果）</span>
      <div className="h-4 w-px bg-border" />
      <Button variant="ghost" size="sm" onClick={onComplete} aria-label="批量完成">
        <CheckCircle className="h-4 w-4 mr-1" /> 完成
      </Button>
      <Button variant="ghost" size="sm" onClick={onSetHigh} aria-label="批量设为高优先级">
        <ChevronUp className="h-4 w-4 mr-1" /> 高优先级
      </Button>
      <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive" aria-label="批量删除">
        <Trash2 className="h-4 w-4 mr-1" /> 删除
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} aria-label="清除选择">
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}

