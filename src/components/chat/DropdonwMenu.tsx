import React, { useState } from 'react';

const DropdownMenu = ({ isOpen, onToggle }) => {
  return (
    <div className="relative -mb-1.5">
      <button 
        onClick={onToggle}
        className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white ${
          isOpen ? 'text-gray-700 dark:text-white' : ''
        }`}
      >
        {/* Icône de menu */}
      </button>
      
      {isOpen && (
        <div 
          className="shadow-theme-lg dark:bg-gray-dark absolute top-full right-0 z-40 w-40 space-y-1 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-800"
        >
          <button className="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
            View More
          </button>
          <button className="text-theme-xs flex w-full rounded-lg px-3 py-2 text-left font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;