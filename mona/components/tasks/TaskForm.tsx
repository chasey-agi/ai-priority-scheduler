"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Flag, Tag, Clock } from "lucide-react";
import { priChToNum, UIPriority } from "@/lib/utils";

type Props = {
  onSubmit: (payload: { content: string; category: string; priority: number; deadline?: string; status?: string }) => Promise<void> | void;
  categories?: string[];
  defaultCategory?: string;
  defaultPriority?: UIPriority;
};

export default function TaskForm({ onSubmit, categories = ["工作","学习","生活"], defaultCategory = "工作", defaultPriority = "中" }: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<string>(defaultCategory);
  const [pri, setPri] = useState<UIPriority>(defaultPriority);
  const [due, setDue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const t = title.trim();
    if (!t || submitting) return;
    const content = desc.trim() ? `${t}\n${desc.trim()}` : t;
    try {
      setSubmitting(true);
      await onSubmit({ content, category: cat, priority: priChToNum(pri), deadline: due || undefined, status: "pending" });
      setTitle(""); setDesc(""); setDue("");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: UIPriority) => {
    switch (priority) {
      case "高": return "bg-red-100 text-red-700 border-red-200";
      case "中": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "低": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "工作": return "💼";
      case "学习": return "📚";
      case "生活": return "🏠";
      case "其他": return "📝";
      default: return "📋";
    }
  };

  return (
    <div className="space-y-4">
      {/* Task Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">任务标题</label>
        <Input 
          placeholder="输入任务标题..." 
          value={title} 
          onChange={(e)=>setTitle(e.target.value)}
          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
        />
      </div>

      {/* Task Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">任务描述</label>
        <Textarea 
          placeholder="添加详细描述（可选）..." 
          value={desc} 
          onChange={(e)=>setDesc(e.target.value)}
          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 min-h-[80px]"
        />
      </div>

      {/* Priority and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Flag className="h-4 w-4" />
            优先级
          </label>
          <Select value={pri} onValueChange={(v:any)=>setPri(v)}>
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="选择优先级"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="高">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-700 border-red-200">高</Badge>
                </div>
              </SelectItem>
              <SelectItem value="中">
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">中</Badge>
                </div>
              </SelectItem>
              <SelectItem value="低">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200">低</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Tag className="h-4 w-4" />
            分类
          </label>
          <Select value={cat} onValueChange={(v:any)=>setCat(v)}>
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="选择分类"/>
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  <div className="flex items-center gap-2">
                    <span>{getCategoryIcon(c)}</span>
                    <span>{c}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          截止日期
        </label>
        <Input 
          type="date" 
          value={due} 
          onChange={e=>setDue(e.target.value)}
          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
        />
      </div>

      {/* Current Selection Preview */}
      {(title || cat || pri) && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">预览</div>
          <div className="flex items-center gap-2 flex-wrap">
            {title && <span className="text-sm font-medium">{title}</span>}
            <Badge className={getPriorityColor(pri)}>{pri}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <span>{getCategoryIcon(cat)}</span>
              <span>{cat}</span>
            </Badge>
            {due && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{due}</span>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" 
        onClick={submit} 
        disabled={submitting || !title.trim()}
      >
        {submitting ? "创建中..." : "创建任务"}
      </Button>
    </div>
  );
}

