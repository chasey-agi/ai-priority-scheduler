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

// 简约亮色配色方案 - 基于数据可视化最佳实践
const chartConfig = {
  completed: {
    label: "已完成",
    color: "#10b981", // 绿色 - 完成状态
  },
  pending: {
    label: "待完成",
    color: "#f59e0b", // 橙色 - 待处理
  },
  overdue: {
    label: "逾期",
    color: "#ef4444", // 红色 - 逾期警告
  },
  work: {
    label: "工作",
    color: "#3b82f6", // 蓝色 - 工作类别
  },
  study: {
    label: "学习",
    color: "#8b5cf6", // 紫色 - 学习类别
  },
  life: {
    label: "生活",
    color: "#06b6d4", // 青色 - 生活类别
  },
  high: {
    label: "高优先级",
    color: "#dc2626", // 深红色 - 高优先级
  },
  medium: {
    label: "中优先级",
    color: "#f59e0b", // 橙色 - 中优先级
  },
  low: {
    label: "低优先级",
    color: "#10b981", // 绿色 - 低优先级
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
      // 验证 createdAt 时间值
      if (task.createdAt) {
        try {
          const createdDateObj = new Date(task.createdAt);
          if (!isNaN(createdDateObj.getTime())) {
            const createdDate = createdDateObj.toISOString().split('T')[0];
            const dayData = last7Days.find(d => d.date === createdDate);
            if (dayData) {
              dayData.created++;
            }
          }
        } catch (error) {
          console.warn('Invalid createdAt date:', task.createdAt, error);
        }
      }

      // 验证 updatedAt 时间值
      if (task.status === 'completed' && task.updatedAt) {
        try {
          const completedDateObj = new Date(task.updatedAt);
          if (!isNaN(completedDateObj.getTime())) {
            const completedDate = completedDateObj.toISOString().split('T')[0];
            const dayData = last7Days.find(d => d.date === completedDate);
            if (dayData) {
              dayData.completed++;
            }
          }
        } catch (error) {
          console.warn('Invalid updatedAt date:', task.updatedAt, error);
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto w-full px-4 py-8 sm:py-12 space-y-8">
        {/* 页面标题区域 */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
            <div className="p-2 bg-slate-600 rounded-full">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-600">数据洞察</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">
            执行力分析报告
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            深度分析任务完成情况，发现执行模式，提供个性化改进建议
          </p>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">总任务数</CardTitle>
              <div className="p-2 bg-slate-600 rounded-lg">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{basicStats.total}</div>
              <p className="text-sm text-slate-500 mt-1">累计创建任务</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">已完成</CardTitle>
              <div className="p-2 bg-green-600 rounded-lg">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{basicStats.completed}</div>
              <p className="text-sm text-slate-500 mt-1">已完成任务</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">待完成</CardTitle>
              <div className="p-2 bg-orange-600 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{basicStats.pending}</div>
              <p className="text-sm text-slate-500 mt-1">待完成任务</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">完成率</CardTitle>
              <div className="p-2 bg-purple-600 rounded-lg">
                {basicStats.completionRate >= 60 ? 
                  <TrendingUp className="h-4 w-4 text-white" /> :
                  <TrendingDown className="h-4 w-4 text-white" />
                }
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-800">{basicStats.completionRate}%</div>
              <div className="mt-3">
                <Progress value={basicStats.completionRate} className="h-2 bg-slate-200" />
              </div>
              <p className="text-sm text-slate-500 mt-2">整体执行效率</p>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 分类完成率 */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-2 bg-slate-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800">
              分类完成率
            </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar dataKey="completed" fill="var(--color-completed)" name="已完成" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pending" fill="var(--color-pending)" name="待完成" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* 任务状态分布 */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-2 bg-slate-600 rounded-lg">
              <PieChartIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800">
              任务状态分布
            </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? chartConfig.completed.color : chartConfig.pending.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* 详细统计和趋势分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 分类详细统计 */}
          <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-2 bg-slate-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800">
              分类详细统计
            </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(basicStats.categoryStats).map(([category, stats]) => {
                  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <div key={category} className="group p-4 bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm" 
                            style={{ backgroundColor: chartConfig[category as keyof typeof chartConfig]?.color || '#666' }} 
                          />
                          <span className="font-semibold text-slate-800">
                            {chartConfig[category as keyof typeof chartConfig]?.label || category}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-slate-600 text-xs">总计</div>
                            <div className="font-bold text-slate-800">{stats.total}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 text-xs">完成</div>
                            <div className="font-bold text-green-700">{stats.completed}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-orange-600 text-xs">待办</div>
                            <div className="font-bold text-orange-700">{stats.total - stats.completed}</div>
                          </div>
                          <Badge 
                            variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}
                            className="px-3 py-1 font-semibold"
                          >
                            {rate}%
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress 
                          value={rate} 
                          className="h-2 bg-slate-200" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 趋势分析和建议 */}
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-2 bg-slate-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800">
              近7天任务趋势
            </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 趋势状态 */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <Badge 
                    variant={trendAnalysis.trend === "excellent" ? "default" : 
                            trendAnalysis.trend === "good" ? "secondary" : 
                            trendAnalysis.trend === "average" ? "outline" : "destructive"}
                    className="px-3 py-1 font-semibold"
                  >
                    {trendAnalysis.trendText}
                  </Badge>
                  <span className="text-sm font-medium text-slate-600">
                    近3天完成率: {Math.round(trendAnalysis.recentRate)}%
                  </span>
                </div>
                <Progress 
                  value={trendAnalysis.recentRate} 
                  className="h-3 bg-slate-200" 
                />
              </div>
              
              {/* 改进建议 */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  个性化建议
                </h4>
                <div className="space-y-2">
                  {trendAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-slate-700 leading-relaxed">
                        {suggestion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 7天趋势图表 */}
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-slate-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800">
              执行力分析
            </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                  <XAxis 
                    dataKey="dateLabel" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="var(--color-pending)" 
                    strokeWidth={3}
                    name="创建任务"
                    dot={{ fill: 'var(--color-pending)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'var(--color-pending)', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="var(--color-completed)" 
                    strokeWidth={3}
                    name="完成任务"
                    dot={{ fill: 'var(--color-completed)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'var(--color-completed)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
