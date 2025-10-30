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
    const checkAuth = async () => {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/");
        return;
      }

      // Get user profile from database
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !userData) {
        console.error("Failed to fetch user data:", error);
        navigate("/");
        return;
      }

      setUserId(userData.id);
      setNickname(userData.nickname);

      // Update last_active timestamp
      await supabase
        .from("users")
        .update({ last_active: new Date().toISOString() })
        .eq("id", userData.id);

      // Start searching for a match automatically
      findMatch();
    };

    checkAuth();

    // Cleanup on unmount
    return () => {
      if (userId) {
        supabase
          .from("users")
          .update({ is_searching: false, current_partner_id: null })
          .eq("id", userId)
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
    
    // Sign out from Supabase
    await supabase.auth.signOut();
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
