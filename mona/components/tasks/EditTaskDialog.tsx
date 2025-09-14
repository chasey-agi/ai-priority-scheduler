"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DBTask, priNumToCh, priChToNum, splitContent } from "@/lib/utils";
import { Calendar, Flag, Tag, Clock, Edit3, Save, X } from "lucide-react";

type Props = {
  task: DBTask | null;
  onClose: () => void;
  onSave: (id: string, patch: { content: string; category?: string; priority?: number; deadline?: string; status?: string; }) => Promise<void> | void;
};

export default function EditTaskDialog({ task, onClose, onSave }: Props) {
  const open = !!task;
  const { first, second } = splitContent(task?.content || "");
  const [title, setTitle] = useState(first);
  const [desc, setDesc] = useState(second);
  const [category, setCategory] = useState(task?.category || "工作");
  const [priority, setPriority] = useState(priNumToCh(typeof task?.priority === 'string' ? parseInt(task.priority) || 3 : task?.priority || 3));
  const [deadline, setDeadline] = useState(task?.deadline || "");
  const [status, setStatus] = useState(task?.status || "pending");

  useEffect(()=>{
    const s = splitContent(task?.content || "");
    setTitle(s.first);
    setDesc(s.second);
    setCategory(task?.category || "工作");
    setPriority(priNumToCh(typeof task?.priority === 'string' ? parseInt(task.priority) || 3 : task?.priority || 3));
    setDeadline(task?.deadline || "");
    setStatus(task?.status || "pending");
  },[task?.id]);

  const save = async ()=>{
    if (!task) return;
    const content = desc.trim()? `${title.trim()}\n${desc.trim()}`: title.trim();
    await onSave(task.id, { content, category, priority: priChToNum(priority), deadline: deadline || undefined, status });
    onClose();
  };

  const getPriorityColor = (priority: string) => {
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
      default: return "📝";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o)=> !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-lg font-semibold text-gray-900">编辑任务</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            修改任务内容、截止日期、优先级与分类，让任务管理更加精准。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* 任务标题 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Edit3 className="h-4 w-4" />
              任务标题
            </label>
            <Input 
              value={title} 
              onChange={e=>setTitle(e.target.value)} 
              placeholder="输入任务标题"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* 任务描述 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Tag className="h-4 w-4" />
              任务描述
            </label>
            <Textarea 
              value={desc} 
              onChange={e=>setDesc(e.target.value)} 
              placeholder="添加详细描述（可选）"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
            />
          </div>
          
          {/* 优先级和分类 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Flag className="h-4 w-4" />
                优先级
              </label>
              <Select value={priority} onValueChange={(v:any)=>setPriority(v)}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="选择优先级"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="高">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700 border-red-200">高</Badge>
                      <span>紧急重要</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="中">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">中</Badge>
                      <span>正常处理</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="低">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 border-green-200">低</Badge>
                      <span>有空再做</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Tag className="h-4 w-4" />
                任务分类
              </label>
              <Select value={category} onValueChange={(v:any)=>setCategory(v)}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="选择分类"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="工作">
                    <div className="flex items-center gap-2">
                      <span>💼</span>
                      <span>工作</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="学习">
                    <div className="flex items-center gap-2">
                      <span>📚</span>
                      <span>学习</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="生活">
                    <div className="flex items-center gap-2">
                      <span>🏠</span>
                      <span>生活</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="其他">
                    <div className="flex items-center gap-2">
                      <span>📝</span>
                      <span>其他</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 截止日期和状态 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4" />
                截止日期
              </label>
              <Input 
                type="date" 
                value={deadline} 
                onChange={e=>setDeadline(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4" />
                任务状态
              </label>
              <Select value={status} onValueChange={(v:any)=>setStatus(v)}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="选择状态"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>待完成</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>已完成</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 当前选择预览 */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">当前设置预览</h4>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getPriorityColor(priority)}>
                <Flag className="h-3 w-3 mr-1" />
                {priority}优先级
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <span>{getCategoryIcon(category)}</span>
                <span>{category}</span>
              </Badge>
              {deadline && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{deadline}</span>
                </Badge>
              )}
              <Badge variant={status === "completed" ? "default" : "secondary"}>
                <Clock className="h-3 w-3 mr-1" />
                {status === "completed" ? "已完成" : "待完成"}
              </Badge>
            </div>
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            取消
          </Button>
          <Button 
            onClick={save}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            保存更改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

