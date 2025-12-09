// src/services/ProviderService.js
import ProxyDatabaseHandler from "./database/ProxyDatabaseHandler";
import RealDatabaseHandler from "./database/RealDatabaseHandler";
import { supabase } from "../lib/supabaseClient";

export default class ProviderService {
  constructor() {
    const realDB = new RealDatabaseHandler();
    this.db = new ProxyDatabaseHandler(realDB, true);
  }

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  }

  async getProviderProjects() {
    const user = await this.getCurrentUser();
    if (!user) return [];

    const { data: profile } = await this.db.getProfileById(user.id);
    if (!profile) return [];

    const { data: projects } = await this.db.getProjectsForProvider(profile.id);
    return projects || [];
  }
}
