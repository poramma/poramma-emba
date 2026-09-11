// ============================================================
// src/components/dashboard/RendezVousChart.tsx
// ============================================================

import { useEffect, useMemo } from 'react';
import { useRendezVousStore } from '../../store/rendezVousStore';
import { Calendar } from 'lucide-react';
import { RDVType } from '../../types/rendez-vous';

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const TYPE_COLORS: Record<RDVType, string> = {
  [RDVType.STANDARD]: 'bg-blue-400',
  [RDVType.URGENCE]: 'bg-red-400',
  [RDVType.PRIORITAIRE]: 'bg-amber-400',
  [RDVType.SUIVI]: 'bg-purple-400',
};

export function RendezVousChart() {
  const { rendezVous, fetchRendezVous } = useRendezVousStore();

  useEffect(() => {
    fetchRendezVous({});
  }, [fetchRendezVous]);

  const data = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const counts = new Array(7).fill(0).map(() => ({ total: 0, byType: {} as Record<RDVType, number> }));
    
    rendezVous.forEach(r => {
      const rdvDate = new Date(r.createdAt);
      const dayDiff = Math.floor((rdvDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff >= 0 && dayDiff < 7) {
        counts[dayDiff].total++;
        counts[dayDiff].byType[r.type] = (counts[dayDiff].byType[r.type] || 0) + 1;
      }
    });
    
    return DAY_NAMES.map((day, i) => ({ day, ...counts[i] }));
  }, [rendezVous]);

  const maxCount = Math.max(...data.map(d => d.total), 1);
  const totalWeek = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-gray-900 dark:text-white">RDV cette semaine</h3>
        </div>
        <span className="text-sm text-gray-500">{totalWeek} total</span>
      </div>
      
      <div className="flex items-end gap-2 h-32">
        {data.map(({ day, total, byType }) => {
          const types = Object.entries(byType) as [RDVType, number][];
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md transition-all duration-500 relative group flex flex-col-reverse overflow-hidden"
                style={{ height: `${(total / maxCount) * 100}%`, minHeight: total > 0 ? '4px' : '0' }}
              >
                {types.map(([type, count]) => (
                  <div
                    key={type}
                    className={`w-full ${TYPE_COLORS[type]} opacity-90`}
                    style={{ height: `${(count / total) * 100}%` }}
                    title={`${type}: ${count}`}
                  />
                ))}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {total} RDV
                </div>
              </div>
              <span className="text-xs text-gray-500">{day}</span>
            </div>
          );
        })}
      </div>
      
      {/* Légende */}
      <div className="flex gap-3 mt-3 justify-center">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-500">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}