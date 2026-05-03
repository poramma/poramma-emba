import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    totalItems  
}) => {return (
    <div className="flex items-center justify-between">
        
        <p className="text-sm text-gray-700">
            {totalItems} items
        </p>

        <nav className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
                Précédent
            </button>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
                Suivant
            </button>
        </nav>

    </div>
    
)}

export default Pagination;