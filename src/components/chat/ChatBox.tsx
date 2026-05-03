import React from 'react';
import Message from './ChatMessage';

const ChatBox = ({ activeChat, onOpenMobileSidebar }) => {
  const messages = [
    { id: 1, text: "I want to make an appointment...", time: "2 hours ago", isMe: false },
    // ... autres messages
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:w-3/4">
      {/* En-tête du chat */}
      <div className="sticky flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 xl:px-6">
        {/* Informations du contact */}
        <button onClick={onOpenMobileSidebar} className="xl:hidden">
          {/* Icône pour ouvrir le sidebar sur mobile */}
        </button>
      </div>

      {/* Zone des messages */}
      <div className="custom-scrollbar max-h-full flex-1 space-y-6 overflow-auto p-5 xl:space-y-8 xl:p-6">
        {messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>

      {/* Champ de saisie */}
      <div className="sticky bottom-0 border-t border-gray-200 p-3 dark:border-gray-800">
        <form className="flex items-center justify-between">
          {/* Champ texte et boutons */}
        </form>
      </div>
    </div>
  );
};

export default ChatBox;