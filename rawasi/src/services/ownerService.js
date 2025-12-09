// src/services/ownerService.js
import RealDatabaseHandler from "../services/database/RealDatabaseHandler";
import ProxyDatabaseHandler from "../services/database/ProxyDatabaseHandler";
import { supabase } from "../lib/supabaseClient";

class OwnerService {
  constructor() {
    const realDB = new RealDatabaseHandler();
    this.db = new ProxyDatabaseHandler(realDB, true);
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  }

  async getOwnerProjects() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: projects, error } = await this.db.getProjectsByUser(user.id);
    if (error || !projects) return [];

    const providerIds = [...new Set(projects.map(p => p.provider_id).filter(Boolean))];

    let providers = [];
    if (providerIds.length > 0) {
      const { data } = await this.db.getProviderProfiles(providerIds);
      providers = data || [];
    }

    const mapped = projects.map(proj => {
      const provider = providers.find(p => p.id === proj.provider_id);

      return {
        id: proj.id,
        name: proj.name,
        location: proj.location,
        status: proj.status || "planning",
        phase: proj.phase || "Design",
        progress: proj.progress_percentage || 0,
        budget: {
          total: proj.budget || 0,
          spent: proj.budget_used || 0,
          remaining: (proj.budget || 0) - (proj.budget_used || 0)
        },
        timeline: {
          months: proj.timeline_months || 12,
          daysTotal: (proj.timeline_months || 12) * 30,
          daysElapsed: Math.floor(((proj.timeline_months || 12) * 30) * ((proj.progress_percentage || 0) / 100)),
          daysRemaining: Math.ceil(((proj.timeline_months || 12) * 30) * (1 - ((proj.progress_percentage || 0) / 100)))
        },
        type: proj.type,
        sizeSqm: proj.size_sqm,
        floors: proj.n_floors,
        techNeeds: proj.tech_needs,
        provider: provider
          ? {
              id: provider.id,
              name: provider.name,
              rating: 4.5
            }
          : null
      };
    });

    return mapped;
  }
}

export default new OwnerService();
