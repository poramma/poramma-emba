const ChatListItem = ({ user, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
    >
      <div className="relative h-12 w-full max-w-[48px] rounded-full">
        <img src={user.img} alt="profile" className="h-full w-full rounded-full object-cover" />
        <span className={`absolute right-0 bottom-0 block h-3 w-3 rounded-full border-[1.5px] border-white dark:border-gray-900 bg-${user.status}-500`}></span>
      </div>
      <div className="w-full">
        <div className="flex items-start justify-between">
          <div>
            <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">{user.name}</h5>
            <p className="text-theme-xs mt-0.5 text-gray-500 dark:text-gray-400">{user.role}</p>
          </div>
          <span className="text-theme-xs text-gray-400">{user.time}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;