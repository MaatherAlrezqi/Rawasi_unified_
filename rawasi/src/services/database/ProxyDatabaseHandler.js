// src/services/database/ProxyDatabaseHandler.js

export default class ProxyDatabaseHandler {
  constructor(realDB, enableLogging = false) {
    this.real = realDB;
    this.enableLogging = enableLogging;
  }

  log(action, payload) {
    if (this.enableLogging) {
      console.log(`Proxy Log → ${action}`, payload);
    }
  }

  from(table) {
    this.log("FROM table", table);
    return this.real.from(table);
  }

  // -----------------------------------------
  // NEW — Proxy wrappers for OwnerService
  // -----------------------------------------

  async getProjectsByUser(userId) {
    this.log("GET Projects for User", userId);
    return await this.real.getProjectsByUser(userId);
  }

  async getProviderProfiles(providerIds) {
    this.log("GET Provider Profiles", providerIds);
    return await this.real.getProviderProfiles(providerIds);
  }

  // -----------------------------------------
  // Existing Chat proxy functions
  // -----------------------------------------

  async upsertConversation(payload) {
    this.log("UPSERT Conversation", payload);
    return await this.real.upsertConversation(payload);
  }

  async getConversations(userId) {
    this.log("GET Conversations for", userId);
    return await this.real.getConversations(userId);
  }

  async fetchMessages(conversationId) {
    this.log("FETCH Messages", conversationId);
    return await this.real.fetchMessages(conversationId);
  }

  async sendMessage(conversationId, userId, text) {
    this.log("SEND Message", { conversationId, userId, text });
    return await this.real.sendMessage(conversationId, userId, text);
  }

  async markMessageRead(conversationId, userId) {
    this.log("MARK Read", { conversationId, userId });
    return await this.real.markMessageRead(conversationId, userId);
  }
  async getProfileById(id) {
  this.log("GET Profile By ID", id);
  return await this.real.getProfileById(id);
}

async getProjectsForProvider(providerId) {
  this.log("GET Projects For Provider", providerId);
  return await this.real.getProjectsForProvider(providerId);
}
async getProviderByAuthUserId(authUserId) {
  this.log("GET provider by auth user id", authUserId);
  return await this.real.getProviderByAuthUserId(authUserId);
}

async fetchRequests(providerId) {
  this.log("FETCH requests for provider", providerId);
  return await this.real.fetchRequests(providerId);
}

async updateRequestStatus(requestId, status) {
  this.log("UPDATE request status", { requestId, status });
  return await this.real.updateRequestStatus(requestId, status);
}

async updateProjectStatus(projectId, payload) {
  this.log("UPDATE project status", payload);
  return await this.real.updateProjectStatus(projectId, payload);
}

async getUserFromAuth() {
  this.log("GET user from auth");
  return await this.real.getUserFromAuth();
}

async getProviderByUserId(userId) {
  console.log("Proxy Log → GET Provider By User ID", userId);
  return this.real.getProviderByUserId(userId);
}
//-------
async createRequest(payload) {
  this.log("CREATE Request", payload);
  return await this.real.createRequest(payload);
}

async getProviderRequests() {
  this.log("GET Provider Requests");
  return await this.real.getProviderRequests();
}

async getProjectOwnerRequests(projectOwnerId) {
  this.log("GET Project Owner Requests", projectOwnerId);
  return await this.real.getProjectOwnerRequests(projectOwnerId);
}

async updateRequestStatus(requestId, status) {
  this.log("UPDATE Request Status", { requestId, status });
  return await this.real.updateRequestStatus(requestId, status);
}
 
async getRequestById(requestId) {
  this.log("GET Request By ID", requestId);
  return await this.real.getRequestById(requestId);
}

async subscribeToProviderRequests(callback) {
  this.log("SUBSCRIBE To Provider Requests");
  return await this.real.subscribeToProviderRequests(callback);
}

async subscribeToProjectOwnerRequests(projectOwnerId, callback) {
  this.log("SUBSCRIBE To Owner Requests", projectOwnerId);
  return await this.real.subscribeToProjectOwnerRequests(projectOwnerId, callback);
}

async saveProject(payload) {
  this.log("SAVE Project Draft", payload);
  return await this.real.saveProject(payload);
}

}
