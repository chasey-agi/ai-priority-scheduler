import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --------- Common Task Utils ---------
export type UIPriority = "高"|"中"|"低";
export type UICategory = "工作"|"学习"|"生活";
export type UIStatus = "todo"|"done";
export type UITask = { id:string; title:string; description?:string; dueDate?:string; priority: UIPriority; category: UICategory; status: UIStatus; order?: number };

export type DBTask = {
  id: string;
  content: string;
  category: string;
  priority: string | number; // can be string from DB or number from code
  status: string; // pending / completed
  deadline?: string | null; // ISO or YYYY-MM-DD or null
  createdAt: string;
  updatedAt: string;
}

export const priChToNum = (p: UIPriority)=> p==="高"?5: p==="中"?3:1;
export const priNumToCh = (n:number):UIPriority => n>=5?"高": n>=3?"中":"低";
export const PRIORITY_STEPS = [1,3,5] as const;
export const nextPriorityValue = (n:number)=>{
  if (n>=5) return 5;
  if (n>=3) return 5;
  return 3;
};
export const prevPriorityValue = (n:number)=>{
  if (n<=1) return 1;
  if (n<=3) return 1;
  return 3;
};
export const stDbToUi = (s:string):UIStatus => s==="completed"?"done":"todo";
export const stUiToDb = (s:UIStatus):"completed"|"pending" => s==="done"?"completed":"pending";

export const splitContent=(c:string)=>{ const [first,...rest]=c.split(/\n|——|—|--/); return { first:(first||c).trim(), second: rest.join(" ").trim()||""}; };

export const mapDBToUI = (t:DBTask):UITask =>{
  const {first,second}=splitContent(t.content);
  let dueDate: string|undefined = undefined;
  if(t.deadline){
    if(/^\d{4}-\d{2}-\d{2}$/.test(t.deadline)) dueDate=t.deadline;
    else { try{ dueDate = new Date(t.deadline).toISOString().slice(0,10);}catch{} }
  }
  // Handle priority as either string or number
  const priorityNum = typeof t.priority === 'string' ? parseInt(t.priority) || 1 : t.priority;
  return {
    id: t.id,
    title: first,
    description: second || undefined,
    dueDate: dueDate||"",
    priority: priNumToCh(priorityNum),
    category: t.category as UICategory,
    status: stDbToUi(t.status),
    order: 0,
  };
};

export const mapUIToDBPatch = (t:Partial<UITask> & {title?:string; description?:string})=>{
  const content = t.description?.trim()? `${t.title?.trim()||""}\n${t.description.trim()}`: (t.title||"").trim();
  return {
    content,
    category: t.category,
    priority: t.priority? priChToNum(t.priority): undefined,
    deadline: t.dueDate||undefined,
    status: t.status? stUiToDb(t.status): undefined,
  };
};

// --------- SWR helpers ---------
export const SWR_KEYS = {
  today: "/api/tasks/today",
  todayWithNoDeadline: "/api/tasks/today?includeNoDeadline=1",
  all: "/api/tasks",
} as const;

// ----- Date helpers -----
export function parseLocalYMD(ymd?: string | null): Date | null {
  if (!ymd) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return new Date(ymd);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

export function isOverdue(t: DBTask) {
  if (t.status === "completed") return false;
  const d = parseLocalYMD(t.deadline as any);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d < today;
}

export function isToday(t: DBTask) {
  const d = parseLocalYMD(t.deadline as any);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return isSameLocalDay(d, today);
}

export function isFuture(t: DBTask) {
  const d = parseLocalYMD(t.deadline as any);
  if (!d) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d > today;
}

export async function fetchJSON<T=any>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const msg = await res.text().catch(()=>"请求失败");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}
