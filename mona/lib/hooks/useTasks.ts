import useSWR, { mutate } from "swr";
import { DBTask, SWR_KEYS, fetchJSON } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export type TaskSource = keyof typeof SWR_KEYS;

const KEY_MAP: Record<TaskSource, string> = {
  today: SWR_KEYS.today,
  todayWithNoDeadline: SWR_KEYS.todayWithNoDeadline,
  all: SWR_KEYS.all,
};

// Enhanced fetcher with auth error handling
const authFetchJSON = async (url: string) => {
  const res = await fetch(url);
  if (res.status === 401) {
    // Redirect to login on auth error
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
};

export function useTasks(source: TaskSource = "all") {
  const { user } = useAuth();
  const router = useRouter();
  const key = user ? KEY_MAP[source] : null; // Only fetch if user is authenticated
  const { data, isLoading, error } = useSWR<{ tasks: DBTask[] }>(key, authFetchJSON);

  const refresh = async () => {
    await Promise.all([
      mutate(SWR_KEYS.today),
      mutate(SWR_KEYS.todayWithNoDeadline),
      mutate(SWR_KEYS.all),
    ]);
  };

  const handleAuthError = (res: Response) => {
    if (res.status === 401) {
      router.push('/auth/login');
      throw new Error('Unauthorized');
    }
  };

  const addTask = async (payload: {
    content: string;
    category: string;
    priority: number;
    deadline?: string | undefined;
    status?: string;
  }) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    handleAuthError(res);
    if (!res.ok) throw new Error(await res.text());
    await refresh();
  };

  const updateTask = async (id: string, patch: Partial<DBTask> & { deadline?: string }) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    handleAuthError(res);
    if (!res.ok) throw new Error(await res.text());
    await refresh();
  };

  const deleteTask = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    handleAuthError(res);
    if (!res.ok) throw new Error(await res.text());
    await refresh();
  };

  const toggleStatus = async (id: string, toCompleted: boolean) => {
    await updateTask(id, { status: toCompleted ? "completed" : "pending" } as any);
  };

  const batchComplete = async (ids: string[]) => {
    const res = await fetch(`/api/tasks/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", ids }),
    });
    if (!res.ok) throw new Error(await res.text());
    await refresh();
  };

  const batchDelete = async (ids: string[]) => {
    const res = await fetch(`/api/tasks/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids }),
    });
    if (!res.ok) throw new Error(await res.text());
    await refresh();
  };

  const batchSetPriority = async (ids: string[], priority: number) => {
    const res = await fetch(`/api/tasks/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setPriority", ids, priority }),
    });
    if (!res.ok) throw new Error(await res.text());
    await refresh();
  };

  return {
    tasks: data?.tasks ?? [],
    isLoading,
    error,
    refresh,
    addTask,
    updateTask,
    deleteTask,
    toggleStatus,
    batchComplete,
    batchDelete,
    batchSetPriority,
  } as const;
}
