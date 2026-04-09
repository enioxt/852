/**
 * Charts Module — 852 Dashboard
 *
 * Code-splitted Recharts component for lazy loading.
 */

'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface ChartData {
  issuesData: Array<{ name: string; count: number }>;
  categoryData: Array<{ name: string; value: number; color: string }>;
  timelineData: Array<{ date: string; relatos: number; relatorios: number }>;
}

export default function ChartsModule({ data }: { data: ChartData }) {
  const { issuesData, categoryData, timelineData } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Principais Problemas */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <h3 className="font-bold text-white mb-6">Volume por Categoria de Problema</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={issuesData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                cursor={{ fill: '#1e293b' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie & Line Charts */}
      <div className="grid grid-rows-2 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex gap-6 items-center">
          <div className="flex-1">
            <h3 className="font-bold text-white mb-2">Categorias dos Issues</h3>
            <p className="text-xs text-slate-400">Distribuição agregada dos tópicos abertos e recentes.</p>
          </div>
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <h3 className="font-bold text-white mb-4">Volume de Relatos e Relatórios</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Line type="monotone" dataKey="relatos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3, fill: '#8b5cf6' }} />
                <Line type="monotone" dataKey="relatorios" stroke="#22c55e" strokeWidth={2} dot={{ r: 2, fill: '#22c55e' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
