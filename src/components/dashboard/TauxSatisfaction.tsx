import { useState } from 'react';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// MOCK : en attendant le backend satisfaction
const MOCK_TAUX = 4.2;
const MOCK_TOTAL = 156;
const MOCK_EVOLUTION = 0.3; // +0.3 vs mois dernier

export function TauxSatisfaction() {
  const [periode] = useState<'semaine' | 'mois' | 'annee'>('mois');

  // ─── INTEGRATION BACKEND ──────────────────────────────────────────
  // const { data } = useQuery({
  //   queryKey: ['satisfaction', periode],
  //   queryFn: () => api.get(`/stats/satisfaction?periode=${periode}`),
  // });
  // const taux = data?.taux || 0;
  // const total = data?.total || 0;
  // const evolution = data?.evolution || 0;
  // ─── FIN INTEGRATION BACKEND ──────────────────────────────────────

  const taux = MOCK_TAUX;
  const total = MOCK_TOTAL;
  const evolution = MOCK_EVOLUTION;

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const EvolutionIcon = evolution > 0 ? TrendingUp : evolution < 0 ? TrendingDown : Minus;
  const evolutionColor = evolution > 0 ? 'text-green-600' : evolution < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Satisfaction usagers</h3>
        <span className="text-xs text-gray-400 capitalize">{periode}</span>
      </div>

      <div className="text-center space-y-3">
        <div className="text-4xl font-bold text-primary">{taux.toFixed(1)}</div>
        
        <div className="flex justify-center gap-1">
          {stars.map((star) => (
            <Star
              key={star}
              className={`h-5 w-5 ${
                star <= Math.round(taux)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-1 text-sm">
          <EvolutionIcon className={`h-4 w-4 ${evolutionColor}`} />
          <span className={evolutionColor}>
            {evolution > 0 ? '+' : ''}{evolution} vs période précédente
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Basé sur {total} évaluations
        </p>
      </div>
    </div>
  );
}