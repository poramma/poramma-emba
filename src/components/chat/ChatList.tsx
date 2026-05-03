import React, { useState } from 'react';
import DropdownMenu from './DropdownMenu';
import ChatListItem from './ChatListItem';

const chatUsers = [
  { id: 1, name: "Kaiya George", role: "Project Manager", time: "15 mins", img: "src/images/user/user-18.jpg", status: "online" },
  // ... autres utilisateurs
];

const ChatList = ({ onSelectChat, onCloseMobile }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredUsers = chatUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="sticky px-4 pt-4 pb-4 sm:px-5 sm:pt-5 xl:pb-0">
        {/* Header avec dropdown */}
        <div className="flex items-start justify-between">
          <h3 className="text-theme-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">Chats</h3>
          <DropdownMenu 
            isOpen={isDropdownOpen}
            onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
          />
        </div>

        {/* Barre de recherche */}
        <div className="mt-4 flex items-center gap-3 pb-14 xl:pb-0">
          <button onClick={onCloseMobile} className="flex h-11 w-full max-w-11 items-center justify-center rounded-lg border border-gray-300 text-gray-700 xl:hidden dark:border-gray-700 dark:text-gray-400">
            {/* Icône menu */}
          </button>
          <div className="relative my-2 w-full">
            <form>
              {/* Champ de recherche */}
            </form>
          </div>
        </div>
      </div>

      {/* Liste des chats */}
      <div className="no-scrollbar flex-col overflow-auto px-4 sm:px-5">
        {filteredUsers.map(user => (
          <ChatListItem 
            key={user.id} 
            user={user} 
            onClick={() => onSelectChat(user)}
          />
        ))}
      </div>
    </>
  );
};

export default ChatList;