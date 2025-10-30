import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ChatWindow from "@/components/chat/ChatWindow";
import MatchingScreen from "@/components/chat/MatchingScreen";
import { useChat } from "@/hooks/useChat";

const Chat = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const { 
    isMatching, 
    partnerId, 
    partnerNickname,
    findMatch, 
    endChat 
  } = useChat(userId);

  useEffect(() => {
    // Check if user is logged in
    const storedUserId = localStorage.getItem("userId");
    const storedNickname = localStorage.getItem("nickname");

    if (!storedUserId || !storedNickname) {
      navigate("/");
      return;
    }

    setUserId(storedUserId);
    setNickname(storedNickname);

    // Update last_active timestamp
    supabase
      .from("users")
      .update({ last_active: new Date().toISOString() })
      .eq("id", storedUserId)
      .then();

    // Start searching for a match automatically
    findMatch();

    // Cleanup on unmount
    return () => {
      if (storedUserId) {
        supabase
          .from("users")
          .update({ is_searching: false, current_partner_id: null })
          .eq("id", storedUserId)
          .then();
      }
    };
  }, [navigate]);

  const handleLogout = async () => {
    if (userId) {
      await supabase
        .from("users")
        .delete()
        .eq("id", userId);
    }
    
    localStorage.removeItem("userId");
    localStorage.removeItem("nickname");
    navigate("/");
  };

  if (!userId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {isMatching || !partnerId ? (
        <MatchingScreen onLogout={handleLogout} />
      ) : (
        <ChatWindow
          userId={userId}
          nickname={nickname}
          partnerId={partnerId}
          partnerNickname={partnerNickname}
          onNext={endChat}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default Chat;
