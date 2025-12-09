// src/services/requestService.js
import { supabase } from '../lib/supabaseClient';
//------------------------------- Start of Proxy addition -------------------------------
import RealDatabaseHandler from "../services/database/RealDatabaseHandler";
import ProxyDatabaseHandler from "../services/database/ProxyDatabaseHandler";
//-------------------------------------------- End of Proxy addition -------------------------------

export const requestService = {
  // Create a request (owner side)
  async createRequest(req) {
    try {
      if (!req.projectOwnerId) throw new Error('projectOwnerId is required');
      if (!req.providerId && !req.directoryProviderId) {
        throw new Error('Provide providerId (direct) OR directoryProviderId (directory).');
      }
      if (req.providerId && req.directoryProviderId) {
        throw new Error('Use either providerId OR directoryProviderId, not both.');
      }

      const payload = {
        project_id: req.projectId ?? null,
        project_owner_id: req.projectOwnerId,           // RLS checks this equals auth.uid()
        provider_id: req.providerId ?? null,            // direct-to-user (optional)
        directory_provider_id: req.directoryProviderId ?? null, // directory (optional)
        project_title: req.projectTitle ?? 'Untitled project',
        project_description: req.projectDescription ?? '',
        budget: req.budget ?? null,
        timeline: req.timeline ?? null,
        message:
          req.message ?? 'New project request from Rawasi platform. Please review and respond.',
        status: 'pending'
      };

      //------------------------------- Start of Proxy addition -------------------------------
      const realDB = new RealDatabaseHandler();
      const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
      //-------------------------------------------- End of Proxy addition -------------------------------

      const { data, error } = await db.createRequest(payload);  // Using Proxy method to create request
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Request creation failed:', e);
      throw e;
    }
  },

  // Provider inbox — let RLS filter (works for both direct & claimed)
  async getProviderRequests() {
    try {
      //------------------------------- Start of Proxy addition -------------------------------
      const realDB = new RealDatabaseHandler();
      const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
      //-------------------------------------------- End of Proxy addition -------------------------------

      const { data, error } = await db.getProviderRequests();  // Using Proxy method here
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Failed to fetch provider requests:', e);
      throw e;
    }
  },

  // Owner’s outbox
  async getProjectOwnerRequests(projectOwnerId) {
    try {
      //------------------------------- Start of Proxy addition -------------------------------
      const realDB = new RealDatabaseHandler();
      const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
      //-------------------------------------------- End of Proxy addition -------------------------------

      const { data, error } = await db.getProjectOwnerRequests(projectOwnerId);  // Using Proxy method here
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Failed to fetch project owner requests:', e);
      throw e;
    }
  },

  // Provider accepts/rejects
  async updateRequestStatus(requestId, status) {
    try {
      if (!['accepted', 'rejected'].includes(status)) {
        throw new Error('Invalid status. Must be "accepted" or "rejected"');
      }

      //------------------------------- Start of Proxy addition -------------------------------
      const realDB = new RealDatabaseHandler();
      const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
      //-------------------------------------------- End of Proxy addition -------------------------------

      const { data, error } = await db.updateRequestStatus(requestId, status);  // Using Proxy method here
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Status update failed:', e);
      throw e;
    }
  },

  // Single request
  async getRequestById(requestId) {
    //------------------------------- Start of Proxy addition -------------------------------
    const realDB = new RealDatabaseHandler();
    const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
    //-------------------------------------------- End of Proxy addition -------------------------------

    const { data, error } = await db.getRequestById(requestId);  // Using Proxy method here
    if (error) throw error;
    return data;
  },

  // Stats (provider)
  async getProviderRequestStats() {
    const reqs = await this.getProviderRequests();
    return {
      total: reqs.length,
      pending: reqs.filter(r => r.status === 'pending').length,
      accepted: reqs.filter(r => r.status === 'accepted').length,
      rejected: reqs.filter(r => r.status === 'rejected').length
    };
  },

  // Stats (owner)
  async getProjectOwnerRequestStats(projectOwnerId) {
    const reqs = await this.getProjectOwnerRequests(projectOwnerId);
    return {
      total: reqs.length,
      pending: reqs.filter(r => r.status === 'pending').length,
      accepted: reqs.filter(r => r.status === 'accepted').length,
      rejected: reqs.filter(r => r.status === 'rejected').length
    };
  },

  // Realtime — rely on RLS (one channel is enough)
  subscribeToProviderRequests(callback) {
    //------------------------------- Start of Proxy addition -------------------------------
    const realDB = new RealDatabaseHandler();
    const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
    //-------------------------------------------- End of Proxy addition -------------------------------

    const channel = db.subscribeToProviderRequests(callback);  // Using Proxy method here
    return channel;
  },

  subscribeToProjectOwnerRequests(projectOwnerId, callback) {
    //------------------------------- Start of Proxy addition -------------------------------
    const realDB = new RealDatabaseHandler();
    const db = new ProxyDatabaseHandler(realDB, true); // Using Proxy to interact with data instead of direct supabase
    //-------------------------------------------- End of Proxy addition -------------------------------

    const channel = db.subscribeToProjectOwnerRequests(projectOwnerId, callback);  // Using Proxy method here
    return channel;
  },

  unsubscribe(channel) {
    if (channel) supabase.removeChannel(channel);  // If using Proxy, remove the channel using Proxy method
  },

  async requestExists(projectId, providerUserId, projectOwnerId, directoryProviderId) {
    try {
      let query = supabase
        .from('requests')
        .select('id')
        .eq('project_owner_id', projectOwnerId)
        .eq('status', 'pending');

      if (projectId == null) {
        query = query.is('project_id', null); // ✅ correct way to compare null
      } else {
        query = query.eq('project_id', projectId);
      }

      const orParts = [];
      if (providerUserId) orParts.push(`provider_id.eq.${providerUserId}`);
      if (directoryProviderId) orParts.push(`directory_provider_id.eq.${directoryProviderId}`);
      if (orParts.length > 0) query = query.or(orParts.join(','));

      const { data, error } = await query;
      if (error) throw error;

      return !!(data && data.length);
    } catch (error) {
      console.error('Error checking request existence:', error);
      return false;
    }
  }

};
