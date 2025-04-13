// components/usage-chart.tsx
"use client";

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface DataPoint {
  date: string;
  credits: number;
}

interface UsageChartProps {
  data?: DataPoint[];
}

// Sample data - would be fetched from API in a real application
const sampleData = [
  { date: '2025-03-28', credits: 120 },
  { date: '2025-03-29', credits: 200 },
  { date: '2025-03-30', credits: 350 },
  { date: '2025-03-31', credits: 180 },
  { date: '2025-04-01', credits: 290 },
  { date: '2025-04-02', credits: 100 },
  { date: '2025-04-03', credits: 220 },
];

export function UsageChart({ data = sampleData }: UsageChartProps) {
  const [timeRange, setTimeRange] = useState("7days");
  
  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 border shadow-sm bg-background">
          <p className="font-medium">{payload[0]?.payload.formattedDate}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">{payload[0]?.value?.toLocaleString()}</span> credits
          </p>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <div className="flex justify-end mb-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              hide={true}
            />
            <YAxis 
              hide={true}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="credits" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorCredits)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}