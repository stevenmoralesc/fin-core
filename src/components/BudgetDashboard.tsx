"use client";

import { useState } from "react";
import { PieChart, Plus, Target, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { BudgetStats } from "@/app/presupuesto/page";
import BudgetModal from "@/components/BudgetModal";

interface BudgetDashboardProps {
  initialStats: BudgetStats[];
}

function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO")}`;
}

export default function BudgetDashboard({ initialStats: stats }: BudgetDashboardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Agrupar por categoría principal
  const categories = Array.from(new Set(stats.map((s) => s.category)));

  const totalBudget = stats.reduce((acc, s) => acc + s.budget, 0);
  const totalSpent = stats.reduce((acc, s) => acc + s.spent, 0);
  const globalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <>
      <div className="space-y-6">
        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Target size={20} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Presupuesto Total</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCOP(totalBudget)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <PieChart size={20} className="text-rose-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Gasto Actual</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCOP(totalSpent)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Ejecución Global</h3>
                <span className={`text-sm font-bold ${globalProgress > 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {globalProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${globalProgress > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(globalProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3 font-medium">
                {globalProgress > 100 
                  ? `Te excediste por ${formatCOP(totalSpent - totalBudget)}` 
                  : `Te quedan ${formatCOP(totalBudget - totalSpent)} disponibles`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Desglose por Categoría ── */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Desglose por Categoría</h2>
            <button 
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus size={16} /> Ajustar Presupuestos
            </button>
          </div>

          {categories.map((cat) => {
            const catStats = stats.filter((s) => s.category === cat);
            const catBudget = catStats.reduce((acc, s) => acc + s.budget, 0);
            const catSpent = catStats.reduce((acc, s) => acc + s.spent, 0);
            const catProgress = catBudget > 0 ? (catSpent / catBudget) * 100 : (catSpent > 0 ? 100 : 0);

            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-gray-900">{cat}</h3>
                      {catProgress > 100 ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                          <XCircle size={12} /> Excedido
                        </span>
                      ) : catProgress > 80 ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                          <AlertTriangle size={12} /> Cerca del límite
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle2 size={12} /> En control
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCOP(catSpent)} <span className="text-gray-400 font-medium">/ {formatCOP(catBudget)}</span></p>
                    </div>
                  </div>
                  <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${catProgress > 100 ? 'bg-red-500' : catProgress > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(catProgress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {catStats.map((sub) => {
                    const subProgress = sub.budget > 0 ? (sub.spent / sub.budget) * 100 : (sub.spent > 0 ? 100 : 0);
                    
                    return (
                      <div key={sub.subcategory} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-medium text-gray-700 truncate">{sub.subcategory}</p>
                        </div>
                        <div className="w-1/3 flex items-center gap-4">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${subProgress > 100 ? 'bg-red-400' : 'bg-gray-400'}`}
                              style={{ width: `${Math.min(subProgress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs font-semibold tabular-nums text-right min-w-[120px] text-gray-600">
                            {formatCOP(sub.spent)} <span className="text-gray-300 font-normal">/ {formatCOP(sub.budget)}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && (
        <BudgetModal 
          stats={stats}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
