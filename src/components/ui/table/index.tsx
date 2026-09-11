// src/components/ui/table/index.tsx

import React, { ReactNode } from 'react';

// ============================================================
// INTERFACES
// ============================================================

export interface TableProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

export interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export interface TableCellProps {
  onClick?: () => void;
  children?: ReactNode;
  isHeader?: boolean;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

// ============================================================
// COMPOSANTS
// ============================================================

/**
 * Table - Composant principal du tableau
 * 
 * @param {TableProps} props
 * @example
 * <Table bordered hover striped>
 *   <TableHeader>...</TableHeader>
 *   <TableBody>...</TableBody>
 * </Table>
 */
export const Table: React.FC<TableProps> = ({ 
  children, 
  className = '',
  bordered = false,
  striped = false,
  hover = false,
  compact = false,
}) => {
  const baseClasses = 'w-full text-sm text-left';
  const borderClasses = bordered ? 'border border-gray-200 dark:border-gray-700' : '';
  const compactClasses = compact ? 'text-xs' : '';
  
  return (
    <div className="w-full overflow-x-auto">
      <table className={`
        ${baseClasses}
        ${borderClasses}
        ${compactClasses}
        ${className}
        dark:bg-gray-800
      `}>
        {children}
      </table>
    </div>
  );
};

/**
 * TableHeader - En-tête du tableau
 * 
 * @param {TableHeaderProps} props
 */
export const TableHeader: React.FC<TableHeaderProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <thead className={`
      bg-gray-50 
      dark:bg-gray-700
      border-b 
      border-gray-200 
      dark:border-gray-600
      ${className}
    `}>
      {children}
    </thead>
  );
};

/**
 * TableBody - Corps du tableau
 * 
 * @param {TableBodyProps} props
 */
export const TableBody: React.FC<TableBodyProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <tbody className={`
      divide-y 
      divide-gray-200 
      dark:divide-gray-700
      ${className}
    `}>
      {children}
    </tbody>
  );
};

/**
 * TableRow - Ligne du tableau
 * 
 * @param {TableRowProps} props
 */
export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '',
  onClick,
  selected = false,
}) => {
  const baseClasses = 'transition-colors duration-150';
  const hoverClasses = onClick ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : '';
  const selectedClasses = selected ? 'bg-brand-50 dark:bg-brand-900/20' : '';
  const stripeClasses = '';
  
  return (
    <tr 
      className={`
        ${baseClasses}
        ${hoverClasses}
        ${selectedClasses}
        ${stripeClasses}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

/**
 * TableCell - Cellule du tableau
 * 
 * @param {TableCellProps} props
 * @example
 * <TableCell>Valeur</TableCell>
 * <TableCell isHeader>En-tête</TableCell>
 * <TableCell align="right" width="100px">Aligné à droite</TableCell>
 */
export const TableCell: React.FC<TableCellProps> = ({
  onClick,
  children,
  isHeader = false,
  className = '',
  colSpan,
  rowSpan,
  align = 'left',
  width,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const baseClasses = 'px-4 py-3';
  const headerClasses = isHeader 
    ? 'font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs'
    : 'text-gray-900 dark:text-white';

  const CellTag = isHeader ? 'th' : 'td';

  return (
    <CellTag
      className={`
        ${baseClasses}
        ${headerClasses}
        ${alignClasses[align]}
        ${className}
      `}
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={{ width }}
      onClick={onClick}
    >
      {children}
    </CellTag>
  );
};

// ============================================================
// COMPOSANTS DÉRIVÉS POUR LES FILTRES ET ACTIONS
// ============================================================

/**
 * TableActions - Conteneur pour les actions d'une ligne
 * Utilisé pour regrouper les boutons d'action
 */
export const TableActions: React.FC<{ children: ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-end gap-2 ${className}`}>
      {children}
    </div>
  );
};

/**
 * TableEmpty - Message affiché quand le tableau est vide
 */
export const TableEmpty: React.FC<{ 
  message?: string; 
  icon?: ReactNode;
  className?: string;
}> = ({ 
  message = 'Aucune donnée disponible', 
  icon,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && <div className="mx-auto mb-4">{icon}</div>}
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

/**
 * TableSkeleton - Affichage de chargement
 */
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// EXPORTATION PAR DÉFAUT
// ============================================================

export default Table;

// ============================================================
// UTILISATION DANS AgentList.tsx
// ============================================================

/* Exemple d'utilisation :

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableActions } from '../ui/table';

// Dans le composant AgentList :
<Table bordered hover>
  <TableHeader>
    <TableRow>
      <TableCell isHeader>Agent</TableCell>
      <TableCell isHeader>Matricule</TableCell>
      <TableCell isHeader>Département</TableCell>
      <TableCell isHeader>Rôle</TableCell>
      <TableCell isHeader>Statut</TableCell>
      <TableCell isHeader>Actif</TableCell>
      <TableCell isHeader align="right">Actions</TableCell>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredAgents.map((agent) => (
      <TableRow key={agent.id} onClick={() => onSelect?.(agent)}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {agent.user.profile.firstName.charAt(0)}
              {agent.user.profile.lastName.charAt(0)}
            </Avatar>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {agent.user.profile.firstName} {agent.user.profile.lastName}
              </div>
              <div className="text-sm text-gray-500">{agent.user.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="font-mono text-sm">{agent.matricule}</span>
        </TableCell>
        <TableCell>{DEPARTMENT_LABELS[agent.department]}</TableCell>
        <TableCell>
          {agent.user.activeRole && getRoleBadge(agent.user.activeRole.name)}
        </TableCell>
        <TableCell>{getStatusBadge(agent.user.status)}</TableCell>
        <TableCell>{getActiveBadge(agent.active)}</TableCell>
        <TableCell align="right">
          <TableActions>
            <Button size="xs" variant="ghost" onClick={() => onEdit?.(agent)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="xs" variant="ghost" onClick={() => onToggleActive?.(agent)}>
              {agent.active ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </Button>
            <Button size="xs" variant="ghost" onClick={() => onDelete?.(agent)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </TableActions>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

*/