// src/components/documents/dashboard/DocumentTypeChart.tsx

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../../ui/card';
import { DocumentType } from '../../../types/etudiant';

interface DocumentTypeChartProps {
  data: Array<{ type: DocumentType; count: number }>;
  isLoading?: boolean;
}

const COLORS = [
  '#10B981', // vert
  '#F59E0B', // orange
  '#3B82F6', // bleu
  '#EF4444', // rouge
  '#8B5CF6', // violet
  '#EC4899', // rose
  '#14B8A6', // teal
  '#F97316', // orange clair
];

const TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.ID_CARD]: 'Carte d\'identité',
  [DocumentType.PASSPORT]: 'Passeport',
  [DocumentType.STUDENT_CERT]: 'Certificat de scolarité',
  [DocumentType.CONSULAR_CARD]: 'Carte consulaire',
  [DocumentType.STUDENT_CARD]: 'Carte d\'étudiant',
  [DocumentType.PHOTO]: 'Photo',
  [DocumentType.PROOF_ADDRESS]: 'Justificatif de domicile',
  [DocumentType.BIRTH_CERT]: 'Acte de naissance',
  [DocumentType.NATIONALITY_CERT]: 'Certificat de nationalité',
  [DocumentType.SCHOLARSHIP_PROOF]: 'Preuve de bourse',
  [DocumentType.OTHER]: 'Autre',
};

export const DocumentTypeChart: React.FC<DocumentTypeChartProps> = ({
  data,
  isLoading = false,
}) => {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    
    // Limiter aux 8 premiers, regrouper le reste sous "Autres"
    if (sorted.length > 8) {
      const top = sorted.slice(0, 8);
      const others = sorted.slice(8);
      const othersCount = others.reduce((sum, item) => sum + item.count, 0);
      return [
        ...top,
        { type: 'OTHER' as DocumentType, count: othersCount, isOthers: true },
      ];
    }
    
    return sorted;
  }, [data]);

  const formatTypeLabel = (type: DocumentType) => {
    if (type === 'OTHER') return 'Autres';
    return TYPE_LABELS[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card className="p-4 h-64">
        <div className="animate-pulse h-full flex items-center justify-center">
          <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 h-64">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Répartition par type de document
      </h4>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="type" 
            tickFormatter={formatTypeLabel}
            tick={{ fontSize: 11 }}
            width={80}
          />
          <Tooltip
            formatter={(value: number) => [`${value} documents`, '']}
            labelFormatter={(label: DocumentType) => formatTypeLabel(label)}
          />
          
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Bar>
          
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default DocumentTypeChart;