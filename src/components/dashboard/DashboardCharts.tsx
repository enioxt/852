/**
 * Dashboard Charts Component — 852 Inteligência
 *
 * Isolated Recharts component for code-splitting.
 * Only loaded when dashboard is accessed.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  label: string;
  value: number;
}

interface DashboardChartsProps {
  activityData: ChartData[];
}

export default function DashboardCharts({ activityData }: DashboardChartsProps) {
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-5 h-5 rounded text-blue-400">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4 4h2v14h-2zm4-2h2v16h-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white">Atividade (7 dias)</h2>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis
              dataKey="label"
              stroke="#525252"
              tick={{ fill: '#737373', fontSize: 12 }}
            />
            <YAxis stroke="#525252" tick={{ fill: '#737373', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#171717',
                border: '1px solid #262626',
                borderRadius: '8px',
                color: '#e5e5e5',
              }}
              itemStyle={{ color: '#60a5fa' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: '#60a5fa', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#93c5fd' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
