'use client';

import { Bot, ArrowLeft, BarChart3, Users, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

// Mock data based on the Sindpol WhatsApp conversation analysis
const issuesData = [
  { name: 'Infraestrutura', count: 45 },
  { name: 'Efetivo', count: 82 },
  { name: 'Assédio Moral', count: 23 },
  { name: 'Plantão', count: 56 },
  { name: 'Salário/Carreira', count: 67 },
];

const categoryData = [
  { name: 'Investigador', value: 65, color: '#3b82f6' },
  { name: 'Escrivão', value: 25, color: '#8b5cf6' },
  { name: 'Delegado', value: 10, color: '#c084fc' },
];

const timelineData = [
  { date: 'Seg', relatos: 12 },
  { date: 'Ter', relatos: 19 },
  { date: 'Qua', relatos: 35 },
  { date: 'Qui', relatos: 22 },
  { date: 'Sex', relatos: 15 },
];

const recentReports = [
  { id: 1, type: 'Efetivo', snippet: 'Apenas 2 investigadores para cobrir plantão de final de semana atendendo 5 cidades...', priority: 'Alta', region: 'Triângulo' },
  { id: 2, type: 'Infraestrutura', snippet: 'Viatura baixada há 3 meses. Estamos usando carro próprio para diligências...', priority: 'Média', region: 'Noroeste' },
  { id: 3, type: 'Carreira', snippet: 'Promoção travada. Colegas do interior sem previsão de nivelamento com a capital...', priority: 'Alta', region: 'Central' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="p-2 bg-purple-600/20 rounded-full">
            <BarChart3 className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Painel de Inteligência</h1>
            <p className="text-xs text-slate-400">EGOS Insights</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total de Relatos</p>
              <h3 className="text-2xl font-bold text-white">273</h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Alertas Críticos</p>
              <h3 className="text-2xl font-bold text-white">41</h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Sugestões de Ação</p>
              <h3 className="text-2xl font-bold text-white">112</h3>
            </div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Bot className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Falsos Positivos</p>
              <h3 className="text-2xl font-bold text-white">3%</h3>
            </div>
          </div>
        </div>

        {/* Charts Section */}
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
                <h3 className="font-bold text-white mb-2">Engajamento por Cargo</h3>
                <p className="text-xs text-slate-400">Distribuição anonimizada dos participantes.</p>
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
              <h3 className="font-bold text-white mb-4">Volume de Relatos (Semana)</h3>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <Line type="monotone" dataKey="relatos" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* AI Processed Feed */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" /> Relatos Processados Recentes
            </h3>
            <span className="text-xs text-slate-400">Dados já anonimizados pela IA</span>
          </div>
          
          <div className="space-y-3">
            {recentReports.map(report => (
              <div key={report.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-800 text-blue-400 rounded-md">
                    {report.type}
                  </span>
                  <div className="flex gap-2">
                    <span className="text-xs text-slate-500">{report.region}</span>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      report.priority === 'Alta' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      Prioridade {report.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-300">&quot;{report.snippet}&quot;</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-3 text-sm text-blue-500 font-medium hover:bg-slate-800 rounded-xl transition">
            Ver Todos os 273 Relatos
          </button>
        </div>
      </main>
    </div>
  );
}
