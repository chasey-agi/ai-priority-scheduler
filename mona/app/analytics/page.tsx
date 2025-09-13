"use client";
import { useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Calendar, CheckCircle, Clock, Target, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { DBTask, SWR_KEYS, fetchJSON, priNumToCh } from "@/lib/utils";
import { cn } from "@/lib/utils";

const chartConfig = {
  completed: {
    label: "已完成",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "待完成",
    color: "hsl(var(--chart-2))",
  },
  work: {
    label: "工作",
    color: "hsl(var(--chart-3))",
  },
  study: {
    label: "学习",
    color: "hsl(var(--chart-4))",
  },
  life: {
    label: "生活",
    color: "hsl(var(--chart-5))",
  },
};



export default function Analytics() {
  const { data, isLoading, error } = useSWR<{tasks: DBTask[]}>(SWR_KEYS.all, fetchJSON);
  const tasks = data?.tasks ?? [];

  // 基础统计数据
  const basicStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // 按分类统计 - 动态收集所有分类
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    
    tasks.forEach(task => {
      const category = task.category || "其他";
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, completed: 0 };
      }
      categoryStats[category].total++;
      if (task.status === "completed") {
        categoryStats[category].completed++;
      }
    });
    
    // 按优先级统计
    const priorityStats = {
      高: { total: 0, completed: 0 },
      中: { total: 0, completed: 0 },
      低: { total: 0, completed: 0 }
    };
    
    tasks.forEach(task => {
      // 确保 priority 是数字类型
      const priorityNum = typeof task.priority === 'string' ? parseInt(task.priority) || 1 : task.priority;
      const priority = priNumToCh(priorityNum);
      priorityStats[priority].total++;
      if (task.status === "completed") {
        priorityStats[priority].completed++;
      }
    });
    
    return {
      total,
      completed,
      pending,
      completionRate,
      categoryStats,
      priorityStats
    };
  }, [tasks]);

  // 图表数据
  const chartData = useMemo(() => {
    // 分类完成率数据
    const categoryData = Object.entries(basicStats.categoryStats).map(([category, stats]) => ({
      category,
      completed: stats.completed,
      pending: stats.total - stats.completed,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }));
    
    // 优先级分布数据
    const priorityData = Object.entries(basicStats.priorityStats).map(([priority, stats]) => ({
      priority,
      completed: stats.completed,
      pending: stats.total - stats.completed,
      total: stats.total
    }));
    
    // 饼图数据
    const pieData = [
      { name: "已完成", value: basicStats.completed },
      { name: "待完成", value: basicStats.pending }
    ];
    
    return {
      categoryData,
      priorityData,
      pieData
    };
  }, [basicStats]);

  // 趋势分析
  // 时间序列趋势分析
  const trendData = useMemo(() => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        dateLabel: date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
        created: 0,
        completed: 0
      };
    });

    tasks.forEach(task => {
      const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.date === createdDate);
      if (dayData) {
        dayData.created++;
      }

      if (task.status === 'completed' && task.updatedAt) {
        const completedDate = new Date(task.updatedAt).toISOString().split('T')[0];
        const dayData = last7Days.find(d => d.date === completedDate);
        if (dayData) {
          dayData.completed++;
        }
      }
    });

    return last7Days;
  }, [tasks]);

  const trendAnalysis = useMemo(() => {
    const { completionRate } = basicStats;
    const recentCompleted = trendData.slice(-3).reduce((sum, day) => sum + day.completed, 0);
    const recentCreated = trendData.slice(-3).reduce((sum, day) => sum + day.created, 0);
    const recentRate = recentCreated > 0 ? (recentCompleted / recentCreated) * 100 : 0;
    
    let trend = "stable";
    let trendText = "保持稳定";
    let suggestions = [];
    
    if (recentRate >= 80) {
      trend = "excellent";
      trendText = "近期执行力优秀";
      suggestions = ["继续保持良好的执行习惯", "可以考虑增加更具挑战性的任务"];
    } else if (recentRate >= 60) {
      trend = "good";
      trendText = "近期执行力良好";
      suggestions = ["尝试优化时间管理", "关注高优先级任务的完成"];
    } else if (recentRate >= 40) {
      trend = "average";
      trendText = "近期执行力一般";
      suggestions = ["建议分解大任务为小任务", "设置更明确的截止时间"];
    } else {
      trend = "poor";
      trendText = "近期需要改进";
      suggestions = ["重新评估任务优先级", "减少同时进行的任务数量", "寻找执行障碍并解决"];
    }
    
    return { trend, trendText, suggestions, recentRate };
  }, [basicStats, trendData]);

  if (error) return <div className="p-6 text-center">加载失败，请刷新重试</div>;
  if (!tasks.length) return (
    <div className="p-6 text-center">
      <div className="text-muted-foreground mb-2">暂无任务数据</div>
      <div className="text-sm text-muted-foreground">创建一些任务后再来查看分析报告</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">数据分析</h1>
        <p className="text-sm text-muted-foreground mt-1">查看执行力数据分析，了解任务完成趋势和改进建议。</p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">总任务</p>
                <p className="text-2xl font-bold">{basicStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold">{basicStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">待完成</p>
                <p className="text-2xl font-bold">{basicStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", 
                basicStats.completionRate >= 80 ? "bg-green-100" :
                basicStats.completionRate >= 60 ? "bg-blue-100" :
                basicStats.completionRate >= 40 ? "bg-yellow-100" : "bg-red-100"
              )}>
                {basicStats.completionRate >= 60 ? 
                  <TrendingUp className={cn("h-4 w-4", 
                    basicStats.completionRate >= 80 ? "text-green-600" : "text-blue-600"
                  )} /> :
                  <TrendingDown className="h-4 w-4 text-red-600" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">完成率</p>
                <p className="text-2xl font-bold">{basicStats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类完成率柱状图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              分类完成率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="var(--color-completed)" name="已完成" />
                  <Bar dataKey="pending" fill="var(--color-pending)" name="待完成" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 任务状态饼图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              任务状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计和趋势分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 分类详细统计 */}
        <Card>
          <CardHeader>
            <CardTitle>分类统计详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(basicStats.categoryStats).map(([category, stats]) => {
              const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category}</span>
                    <Badge variant="outline">{stats.completed}/{stats.total}</Badge>
                  </div>
                  <Progress value={rate} className="h-2" />
                  <p className="text-sm text-muted-foreground">完成率: {rate}%</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 7天趋势图表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              近7天任务趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="var(--color-pending)" 
                    strokeWidth={2}
                    name="创建任务"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="var(--color-completed)" 
                    strokeWidth={2}
                    name="完成任务"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={trendAnalysis.trend === "excellent" ? "default" : 
                          trendAnalysis.trend === "good" ? "secondary" : 
                          trendAnalysis.trend === "average" ? "outline" : "destructive"}
                >
                  {trendAnalysis.trendText}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  近3天完成率: {Math.round(trendAnalysis.recentRate)}%
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium">改进建议:</h4>
                <ul className="space-y-1">
                  {trendAnalysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
