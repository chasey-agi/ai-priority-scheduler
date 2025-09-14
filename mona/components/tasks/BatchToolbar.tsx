"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2, ChevronUp, XCircle, Users } from "lucide-react";

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
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-medium text-gray-700">批量操作</span>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
          {selectedCount} 项
        </Badge>
        <span className="text-xs text-gray-500">（仅当前筛选结果）</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onComplete} 
          aria-label="批量完成"
          className="hover:bg-green-100 hover:text-green-700 text-green-600"
        >
          <CheckCircle className="h-4 w-4 mr-1" /> 
          完成
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSetHigh} 
          aria-label="批量设为高优先级"
          className="hover:bg-orange-100 hover:text-orange-700 text-orange-600"
        >
          <ChevronUp className="h-4 w-4 mr-1" /> 
          高优先级
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDelete} 
          aria-label="批量删除"
          className="hover:bg-red-100 hover:text-red-700 text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-1" /> 
          删除
        </Button>
        
        <div className="h-4 w-px bg-gray-300 mx-1" />
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear} 
          aria-label="清除选择"
          className="hover:bg-gray-100 text-gray-500"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

