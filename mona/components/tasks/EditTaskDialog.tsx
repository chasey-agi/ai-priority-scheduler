"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DBTask, priNumToCh, priChToNum, splitContent } from "@/lib/utils";

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

  return (
    <Dialog open={open} onOpenChange={(o)=> !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑任务</DialogTitle>
          <DialogDescription>修改任务内容、截止日期、优先级与分类。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2"><label className="text-sm font-medium">标题</label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="任务标题"/></div>
          <div className="space-y-2"><label className="text-sm font-medium">描述</label><Textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="补充描述"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">优先级</label>
              <Select value={priority} onValueChange={(v:any)=>setPriority(v)}>
                <SelectTrigger><SelectValue placeholder="优先级"/></SelectTrigger>
                <SelectContent><SelectItem value="高">高</SelectItem><SelectItem value="中">中</SelectItem><SelectItem value="低">低</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Select value={category} onValueChange={(v:any)=>setCategory(v)}>
                <SelectTrigger><SelectValue placeholder="分类"/></SelectTrigger>
                <SelectContent><SelectItem value="工作">工作</SelectItem><SelectItem value="学习">学习</SelectItem><SelectItem value="生活">生活</SelectItem><SelectItem value="其他">其他</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><label className="text-sm font-medium">截止日期</label><Input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select value={status} onValueChange={(v:any)=>setStatus(v)}>
                <SelectTrigger><SelectValue placeholder="状态"/></SelectTrigger>
                <SelectContent><SelectItem value="pending">待完成</SelectItem><SelectItem value="completed">已完成</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={save}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

