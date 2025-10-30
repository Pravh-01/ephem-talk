import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  content: string;
  imageData?: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <span className="text-xs text-muted-foreground px-3">
          {isOwn ? "You" : message.senderNickname}
        </span>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isOwn
              ? "bg-gradient-to-br from-primary to-primary-glow text-white rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          } shadow-sm`}
        >
          {message.imageData && (
            <img
              src={message.imageData}
              alt="Shared image"
              className="rounded-lg mb-2 max-w-full h-auto"
              style={{ maxHeight: "300px" }}
            />
          )}
          {message.content && (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground px-3">
          {format(message.timestamp, "HH:mm")}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
