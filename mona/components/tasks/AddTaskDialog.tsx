"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskForm from "./TaskForm";

type Props = {
  onSubmit: (task: {
    content: string;
    category: string;
    priority: number;
    deadline?: string;
    status?: string;
  }) => Promise<void>;
  categories: string[];
};

export default function AddTaskDialog({ onSubmit, categories }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (task: {
    content: string;
    category: string;
    priority: number;
    deadline?: string;
    status?: string;
  }) => {
    setIsSubmitting(true);
    try {
      await onSubmit(task);
      setOpen(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white">
          <Plus className="h-4 w-4" />
          新增任务
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            创建新任务
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TaskForm
            onSubmit={handleSubmit}
            categories={categories}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}