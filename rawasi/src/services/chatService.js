// src/services/chatService.js
import { supabase } from "../lib/supabase";

//------------------------------- Start of Proxy addition -------------------------------
import RealDatabaseHandler from "../services/database/RealDatabaseHandler";
import ProxyDatabaseHandler from "../services/database/ProxyDatabaseHandler";
//-------------------------------------------- End of Proxy addition -------------------------------

const meId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
};

export const chatService = {

  // Create or get conversation
  getOrCreateConversation: async (otherId, projectId) => {
    const me = await meId();
    const [a, b] = me < otherId ? [me, otherId] : [otherId, me];

    //------------------------------- Start of Proxy addition -------------------------------
    const db = new ProxyDatabaseHandler(new RealDatabaseHandler(), true);
    //-------------------------------------------- End of Proxy addition -------------------------------

    const { data, error } = await db.upsertConversation({
      project_id: projectId,
      a,
      b
    });

    if (error) throw error;
    return data;
  },

  // List all conversations for current user
  listConversations: async () => {
    const me = await meId();

    //------------------------------- Start of Proxy addition -------------------------------
    const db = new ProxyDatabaseHandler(new RealDatabaseHandler(), true);
    //-------------------------------------------- End of Proxy addition -------------------------------

    const { data: convs, error } = await db.getConversations(me);
    if (error) throw error;

    const rows = await Promise.all(
      convs.map(async (c) => {
        const otherId = c.a === me ? c.b : c.a;

        const [{ data: other }, { data: last }] = await Promise.all([
          supabase.from("profiles").select("id,name,role").eq("id", otherId).single(),
          supabase
            .from("messages")
            .select("body,created_at,sender,is_read")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
        ]);

        return { ...c, other, last: last?.[0] || null };
      })
    );

    return rows;
  },

  // Fetch all messages inside a conversation
  fetchMessages: async (conversationId) => {

    //------------------------------- Start of Proxy addition -------------------------------
    const db = new ProxyDatabaseHandler(new RealDatabaseHandler(), true);
    //-------------------------------------------- End of Proxy addition -------------------------------

    const { data, error } = await db.fetchMessages(conversationId);
    if (error) throw error;
    return data;
  },

  // Send a new message
  send: async (conversationId, text) => {
    const me = await meId();

    //------------------------------- Start of Proxy addition -------------------------------
    const db = new ProxyDatabaseHandler(new RealDatabaseHandler(), true);
    //-------------------------------------------- End of Proxy addition -------------------------------

    const { error } = await db.sendMessage(conversationId, me, text);
    if (error) throw error;
  },

  // Mark all messages in conversation as read
  markRead: async (conversationId) => {
    const me = await meId();

    //------------------------------- Start of Proxy addition -------------------------------
    const db = new ProxyDatabaseHandler(new RealDatabaseHandler(), true);
    //-------------------------------------------- End of Proxy addition -------------------------------

    await db.markMessageRead(conversationId, me);
  },

  // Supabase realtime subscription (Proxy not needed)
  subscribe: (conversationId, onNew) => {
    const channel = supabase
      .channel("chat-" + conversationId)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => onNew(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
};
