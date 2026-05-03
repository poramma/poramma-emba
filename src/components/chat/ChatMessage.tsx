const Message = ({ message }) => {
  return (
    <div className={`max-w-[350px] ${message.isMe ? 'ml-auto text-right' : ''}`}>
      <div className={`flex items-start gap-4 ${message.isMe ? 'flex-row-reverse' : ''}`}>
        {!message.isMe && (
          <div className="h-10 w-full max-w-10 rounded-full">
            <img src={message.senderImg} alt="profile" className="h-full w-full rounded-full object-cover" />
          </div>
        )}
        
        <div>
          <div className={`rounded-lg px-3 py-2 ${
            message.isMe 
              ? 'bg-brand-500 text-white dark:bg-brand-500' 
              : 'bg-gray-100 text-gray-800 dark:bg-white/5 dark:text-white/90'
          } ${message.isMe ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
            <p className="text-sm">{message.text}</p>
          </div>
          <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
            {message.isMe ? message.time : `${message.sender}, ${message.time}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Message;