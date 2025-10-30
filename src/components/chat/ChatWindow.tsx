import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, SkipForward, Flag, LogOut, Image as ImageIcon } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ReportDialog from "./ReportDialog";

interface Message {
  id: string;
  senderId: string;
  senderNickname: string;
  content: string;
  imageData?: string;
  timestamp: Date;
}

interface ChatWindowProps {
  userId: string;
  nickname: string;
  partnerId: string;
  partnerNickname: string;
  onNext: () => void;
  onLogout: () => void;
}

const ChatWindow = ({ 
  userId, 
  nickname, 
  partnerId, 
  partnerNickname, 
  onNext, 
  onLogout 
}: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up real-time channel for messaging
  useEffect(() => {
    const channelName = [userId, partnerId].sort().join("-");
    const channel = supabase.channel(`chat:${channelName}`);

    channel
      .on("broadcast", { event: "message" }, (payload) => {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          senderId: payload.payload.senderId,
          senderNickname: payload.payload.senderNickname,
          content: payload.payload.content,
          imageData: payload.payload.imageData,
          timestamp: new Date(payload.payload.timestamp),
        };
        setMessages((prev) => [...prev, newMessage]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userId, partnerId]);

  const sendMessage = async (content: string, imageData?: string) => {
    if ((!content.trim() && !imageData) || !channelRef.current) return;

    const message = {
      senderId: userId,
      senderNickname: nickname,
      content: content.trim(),
      imageData,
      timestamp: new Date().toISOString(),
    };

    // Add to local state immediately
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        senderId: userId,
        senderNickname: nickname,
        content: content.trim(),
        imageData,
        timestamp: new Date(),
      },
    ]);

    // Broadcast to partner
    await channelRef.current.send({
      type: "broadcast",
      event: "message",
      payload: message,
    });

    setInputText("");
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(inputText);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      await sendMessage("", base64Data);
      toast.success("Image sent!");
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleNext = () => {
    setMessages([]);
    onNext();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-white font-bold">
            {partnerNickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{partnerNickname}</h2>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsReportOpen(true)}
            title="Report abuse"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            title="Next person"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Say hello! 👋</p>
              <p className="text-sm">Start a conversation with {partnerNickname}</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === userId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4">
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Send image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={500}
          />
          <Button
            type="submit"
            disabled={!inputText.trim()}
            size="icon"
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <ReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reporterId={userId}
        reportedUserId={partnerId}
      />
    </div>
  );
};

export default ChatWindow;
