"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <div className="space-y-3">
      <Input placeholder="任务标题（必填）" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <Textarea placeholder="补充描述（可选）" value={desc} onChange={(e)=>setDesc(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Select value={pri} onValueChange={(v:any)=>setPri(v)}>
          <SelectTrigger><SelectValue placeholder="优先级"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="高">高</SelectItem>
            <SelectItem value="中">中</SelectItem>
            <SelectItem value="低">低</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cat} onValueChange={(v:any)=>setCat(v)}>
          <SelectTrigger><SelectValue placeholder="分类"/></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Input type="date" value={due} onChange={e=>setDue(e.target.value)} />
      <Button className="w-full" onClick={submit} disabled={submitting || !title.trim()}>添加</Button>
    </div>
  );
}

