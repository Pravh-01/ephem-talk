import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useChat = (userId: string | null) => {
  const [isMatching, setIsMatching] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const findMatch = useCallback(async () => {
    if (!userId) return;

    setIsMatching(true);
    setPartnerId(null);
    setPartnerNickname("");

    try {
      // Mark user as searching
      await supabase
        .from("users")
        .update({ is_searching: true })
        .eq("id", userId);

      // Find another user who is searching
      const { data: searchingUsers, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("is_searching", true)
        .neq("id", userId)
        .is("current_partner_id", null)
        .limit(1);

      if (searchError) throw searchError;

      if (searchingUsers && searchingUsers.length > 0) {
        const partner = searchingUsers[0];

        // Create a chat session
        const { data: session, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert([
            {
              user1_id: userId,
              user2_id: partner.id,
            },
          ])
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Update both users
        await Promise.all([
          supabase
            .from("users")
            .update({
              is_searching: false,
              current_partner_id: partner.id,
            })
            .eq("id", userId),
          supabase
            .from("users")
            .update({
              is_searching: false,
              current_partner_id: userId,
            })
            .eq("id", partner.id),
        ]);

        setPartnerId(partner.id);
        setPartnerNickname(partner.nickname);
        setSessionId(session.id);
        setIsMatching(false);
        toast.success(`Matched with ${partner.nickname}!`);
      } else {
        // No match found, keep searching
        setTimeout(() => findMatch(), 2000);
      }
    } catch (error: any) {
      console.error("Matching error:", error);
      toast.error("Failed to find a match. Retrying...");
      setTimeout(() => findMatch(), 3000);
    }
  }, [userId]);

  const endChat = useCallback(async () => {
    if (!userId) return;

    try {
      // End the current session
      if (sessionId) {
        await supabase
          .from("chat_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      // Reset user's matching status
      await supabase
        .from("users")
        .update({
          is_searching: false,
          current_partner_id: null,
        })
        .eq("id", userId);

      // Find a new match
      findMatch();
    } catch (error: any) {
      console.error("End chat error:", error);
      toast.error("Failed to switch to next person");
    }
  }, [userId, sessionId, findMatch]);

  // Listen for partner updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        async (payload) => {
          const updatedUser = payload.new;
          
          if (updatedUser.current_partner_id && !partnerId) {
            // We got matched by someone else
            const { data: partner } = await supabase
              .from("users")
              .select("*")
              .eq("id", updatedUser.current_partner_id)
              .single();

            if (partner) {
              setPartnerId(partner.id);
              setPartnerNickname(partner.nickname);
              setIsMatching(false);
              toast.success(`Matched with ${partner.nickname}!`);
            }
          } else if (!updatedUser.current_partner_id && partnerId) {
            // Partner left, find new match
            toast.info("Your partner left. Finding someone new...");
            findMatch();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, partnerId, findMatch]);

  return {
    isMatching,
    partnerId,
    partnerNickname,
    sessionId,
    findMatch,
    endChat,
  };
};

