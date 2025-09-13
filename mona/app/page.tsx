"use client";
import {useMemo,useState, useEffect, useRef} from "react";
import useSWR, { mutate } from "swr";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Badge} from "@/components/ui/badge";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from "@/components/ui/table";
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from "@/components/ui/dialog";
import { Edit2, Trash2, Mic, Square, Loader2 } from "lucide-react";
import { DBTask, SWR_KEYS, fetchJSON, priChToNum, priNumToCh, splitContent, isOverdue, isFuture } from "@/lib/utils";
import TaskTable from "@/components/tasks/TaskTable";
import EditTaskDialog from "@/components/tasks/EditTaskDialog";
import { useTasks } from "@/lib/hooks/useTasks";
import { cn } from "@/lib/utils";

/* 删除未使用的 Overview 组件，避免重复逻辑与维护开销 */


const SpeechHint = () => (
  <div className="text-xs text-muted-foreground space-y-1">
    <p>语音示例："今天下午三点前提交项目周报，优先级高"</p>
    <p>可识别的关键词：今天/明天/后天；优先级高/中/低；日期如 2025-09-30。</p>
  </div>
);

export default function HomePage(){
  const { tasks, isLoading, addTask, updateTask, deleteTask, toggleStatus } = useTasks("today");
  const { tasks: allTasks } = useTasks("all");
  const overdueCount = useMemo(()=> allTasks.filter(isOverdue).length, [allTasks]);
  const futureCount = useMemo(()=> allTasks.filter(isFuture).length, [allTasks]);

  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [pri,setPri]=useState("中");
  const [cat,setCat]=useState("工作");
  const [due,setDue]=useState("");

  // ===== 语音输入（Web Speech API） =====
  const [recSupported, setRecSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(()=>{
    // 检测是否支持媒体录音
    setRecSupported(!!navigator.mediaDevices?.getUserMedia);
    
    // 确保用户profile存在
    const ensureProfile = async () => {
      try {
        await fetch('/api/create-profile', { method: 'POST' });
      } catch (error) {
        console.error('Failed to ensure profile:', error);
      }
    };
    ensureProfile();
  },[]);

  const parseSpeech = (raw: string) => {
    const text = raw.trim();
    let nextPri = pri; // 默认沿用当前选择
    let nextDue = due; // 默认沿用当前选择

    // 优先级提取（"优先级高" / "高优先级" / "高"）
    if(/(优先级\s*高|高\s*优先级)/.test(text) || /\b高\b/.test(text)) nextPri = "高";
    if(/(优先级\s*中|中\s*优先级)/.test(text) || /\b中\b/.test(text)) nextPri = "中";
    if(/(优先级\s*低|低\s*优先级)/.test(text) || /\b低\b/.test(text)) nextPri = "低";

    // 日期提取：YYYY-MM-DD
    const dateMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if(dateMatch){
      const y = Number(dateMatch[1]);
      const m = String(Number(dateMatch[2])).padStart(2, "0");
      const d = String(Number(dateMatch[3])).padStart(2, "0");
      nextDue = `${y}-${m}-${d}`;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth()+1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const today = `${y}-${m}-${d}`;
      const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);
      const t2y = tomorrowDate.getFullYear();
      const t2m = String(tomorrowDate.getMonth()+1).padStart(2, "0");
      const t2d = String(tomorrowDate.getDate()).padStart(2, "0");
      const tomorrow = `${t2y}-${t2m}-${t2d}`;
      const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate()+2);
      const dAy = dayAfter.getFullYear();
      const dAm = String(dayAfter.getMonth()+1).padStart(2, "0");
      const dAd = String(dayAfter.getDate()).padStart(2, "0");
      const afterTomorrow = `${dAy}-${dAm}-${dAd}`;

      if(/今天/.test(text)) nextDue = today;
      else if(/明天/.test(text)) nextDue = tomorrow;
      else if(/后天/.test(text)) nextDue = afterTomorrow;
    }

    // 标题/描述拆分
    const { first, second } = splitContent(text);

    return { nextTitle: first, nextDesc: second, nextPri, nextDue };
  };

  const startVoice = async ()=>{
    try{
      setRecording(true);
      setVoiceText("");
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setRecording(false);
        setProcessing(true);
        
        try {
           const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           const formData = new FormData();
           formData.append('audio', audioBlob, 'recording.webm');
           
           const response = await fetch('/api/transcribe', {
             method: 'POST',
             body: formData,
           });
           
           const result = await response.json();
           
           if (response.ok && result.success) {
             setVoiceText(result.transcription);
             
             // 回填提取的数据
             const extracted = result.extracted;
             if (extracted.title) setTitle(extracted.title);
             if (extracted.description) setDesc(extracted.description);
             if (extracted.priority) setPri(extracted.priority);
             if (extracted.category) setCat(extracted.category);
             if (extracted.deadline) setDue(extracted.deadline);
           } else {
             // 显示具体的错误信息
             const errorMessage = result.error || '转录失败，请重试';
             alert(errorMessage);
             
             // 如果有转录文本但提取失败，仍然显示转录文本
             if (result.transcription) {
               setVoiceText(result.transcription);
             }
           }
         } catch (error) {
           console.error('处理音频时出错:', error);
           alert('网络错误，请检查网络连接后重试');
         } finally {
           setProcessing(false);
         }
        
        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
    }catch(e){
      console.error('启动录音失败:', e);
      setRecording(false);
    }
  };

  const stopVoice = ()=>{
    const mediaRecorder = mediaRecorderRef.current;
    if(mediaRecorder && mediaRecorder.state === 'recording'){
      mediaRecorder.stop();
    }
  };

  const todays = tasks;
  const completedCount = tasks.filter(t=> t.status === "completed").length;

  const add=async()=>{
    const t=title.trim();
    if(!t) return;
    const content = desc.trim()? `${t}\n${desc.trim()}`: t;
    await addTask({ content, category: cat, priority: priChToNum(pri as any), deadline: due||undefined, status: "pending" });
    setTitle(""); setDesc(""); setDue(""); setVoiceText("");
  };

  const toggle=async(id:string,checked:boolean|string)=>{ await toggleStatus(id, Boolean(checked)); };

  // 编辑 & 删除保留（用于轻量操作）
  const [edit,setEdit]=useState<null|DBTask>(null);

  const del=async(id:string)=>{ await deleteTask(id); };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">今日概览</h1>
          <p className="text-sm text-muted-foreground mt-1">突出今天的任务情况，支持手动/语音快速添加。</p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-3">
          <span>
            今日进度：<span className="font-medium text-foreground ml-1">{completedCount}</span>/<span>{todays.length}</span>
          </span>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <span>逾期 {overdueCount}</span>
          <span className="hidden sm:inline">将来 {futureCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>快速创建任务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="任务标题（必填）" value={title} onChange={e=>setTitle(e.target.value)} />
              {recSupported && (
                processing ? (
                  <Button variant="secondary" size="icon" disabled title="处理中">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </Button>
                ) : recording ? (
                  <Button variant="secondary" size="icon" onClick={stopVoice} title="停止录音" className="bg-red-50 border-red-200">
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="secondary" size="icon" onClick={startVoice} title="语音输入">
                    <Mic className="h-4 w-4" />
                  </Button>
                )
              )}
            </div>
            <Textarea placeholder="补充描述（可选）" value={desc} onChange={e=>setDesc(e.target.value)} />
            {voiceText && (
              <div className="text-xs text-muted-foreground">
                语音识别：{voiceText}
              </div>
            )}
            <SpeechHint />
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
                  <SelectItem value="工作">工作</SelectItem>
                  <SelectItem value="学习">学习</SelectItem>
                  <SelectItem value="生活">生活</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input type="date" value={due} onChange={e=>setDue(e.target.value)} />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={add} disabled={isLoading || processing}>添加</Button>
              {voiceText && (
                <Button variant="outline" onClick={()=>{ setVoiceText(""); }}>清除语音</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>当日任务</CardTitle></CardHeader>
          <CardContent>
            <TaskTable 
              tasks={tasks}
              isLoading={isLoading}
              onToggleStatus={toggle}
              onEdit={(t)=> setEdit(t)}
              onDelete={(id)=> del(id)}
            />
          </CardContent>
        </Card>
      </div>

      {/* 简易编辑对话框（复用原逻辑） */}
      <EditTaskDialog task={edit} onClose={()=> setEdit(null)} onSave={async(id, patch)=>{ await updateTask(id, patch as any); }} />
    </div>
  );
}
