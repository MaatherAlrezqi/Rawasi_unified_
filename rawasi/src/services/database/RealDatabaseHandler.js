// src/services/database/RealDatabaseHandler.js
import { supabase } from "../../lib/supabase";

export default class RealDatabaseHandler {

  from(table) {
    return supabase.from(table);
  }

  // 🔹 NEW — Get all projects owned by specific user
  async getProjectsByUser(userId) {
    return await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }

  // 🔹 NEW — Get provider profiles by array of IDs
  async getProviderProfiles(providerIds) {
    return await supabase
      .from("profiles")
      .select("id, name")
      .in("id", providerIds);
  }

  // -----------------------------
  // Existing Chat Functions (No Change)
  // -----------------------------

  async upsertConversation(payload) {
    return await supabase
      .from("conversations")
      .upsert(payload, { onConflict: "project_id,a,b" })
      .select("id")
      .single();
  }

  async getConversations(userId) {
    return await supabase
      .from("conversations")
      .select("id, project_id, a, b, created_at")
      .or(`a.eq.${userId},b.eq.${userId}`)
      .order("created_at", { ascending: false });
  }

  async fetchMessages(conversationId) {
    return await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
  }

  async sendMessage(conversationId, senderId, text) {
    return await supabase
      .from("messages")
      .insert([{ conversation_id: conversationId, sender: senderId, body: text }]);
  }

  async markMessageRead(conversationId, userId) {
    return await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender", userId);
  }
  async getProfileById(id) {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
}

async getProjectsForProvider(providerId) {
  return await supabase
    .from("projects")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
}
async getProviderByAuthUserId(userId) {
  return await supabase
    .from("provider")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();
}

async fetchRequests(providerId) {
  return await supabase
    .from("project_requests")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false });
}

async updateRequestStatus(requestId, status) {
  return await supabase
    .from("project_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);
}

async updateProjectStatus(projectId, payload) {
  return await supabase
    .from("projects")
    .update(payload)
    .eq("id", projectId);
}
async getUserFromAuth() {
  return await supabase.auth.getUser();
}
async getProviderByUserId(userId) {
  try {
    const { data, error } = await this.supabase
      .from("providers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("RealHandler → Error getProviderByUserId:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("RealHandler → Exception getProviderByUserId:", err);
    return null;
  }
}
//--------
async createRequest(payload) {
  return await supabase.from('requests').insert([payload]).select().single();
}

async getProviderRequests() {
  return await supabase.from('requests').select('*').order('created_at', { ascending: false });
}

async getProjectOwnerRequests(projectOwnerId) {
  return await supabase
    .from('requests')
    .select('*')
    .eq('project_owner_id', projectOwnerId)
    .order('created_at', { ascending: false });
}

async updateRequestStatus(requestId, status) {
  return await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();
}

async getRequestById(requestId) {
  return await supabase.from('requests').select('*').eq('id', requestId).single();
}

subscribeToProviderRequests(callback) {
  return supabase
    .channel('provider-requests')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, callback)
    .subscribe();
}

subscribeToProjectOwnerRequests(projectOwnerId, callback) {
  return supabase
    .channel('owner-requests-' + projectOwnerId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `project_owner_id=eq.${projectOwnerId}` }, callback)
    .subscribe();
}

async saveProject(payload) {
  return await supabase
    .from('projects')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
}


}
