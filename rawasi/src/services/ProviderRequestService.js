import ProxyDatabaseHandler from "./database/ProxyDatabaseHandler";
import RealDatabaseHandler from "./database/RealDatabaseHandler";

export default class ProviderRequestService {
  constructor() {
    const real = new RealDatabaseHandler();
    this.db = new ProxyDatabaseHandler(real, true); // enable logging
  }

  async getCurrentUser() {
    return await this.db.getUserFromAuth();
  }

  async getProviderByUserId(userId) {
    return await this.db.getProviderByUserId(userId);
  }

  async getRequestsForProvider(providerId) {
    return await this.db.getRequestsForProvider(providerId);
  }

  async updateRequestStatus(requestId, status) {
    return await this.db.updateRequestStatus(requestId, status);
  }

  async updateProjectStatus(projectId, status, providerInfo) {
    return await this.db.updateProjectStatus(projectId, status, providerInfo);
  }
}
