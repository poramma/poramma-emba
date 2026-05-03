import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatSidebar from './ChatSidebar';
import ChatBox from './ChatBox';

const ChatPage = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="h-[calc(100vh-186px)] overflow-hidden sm:h-[calc(100vh-174px)]">
      <div className="flex h-full flex-col gap-6 xl:flex-row xl:gap-5">
        <ChatSidebar 
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onSelectChat={setActiveChat}
        />
        
        <ChatBox 
          activeChat={activeChat}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
      </div>
    </div>
  );
};

export default ChatPage;