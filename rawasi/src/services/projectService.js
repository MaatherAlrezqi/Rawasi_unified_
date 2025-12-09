// src/services/projectService.js
import { supabase } from "../lib/supabaseClient";
//------------------------------- Start of Proxy addition -------------------------------
import RealDatabaseHandler from "../services/database/RealDatabaseHandler";
import ProxyDatabaseHandler from "../services/database/ProxyDatabaseHandler";
//-------------------------------------------- End of Proxy addition -------------------------------

export async function saveDraftProject(p) {
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error("You must be logged in");

  const payload = {
    user_id: user.id,
    name: p.name || "Untitled project",
    type: p.type || "Residential",
    location: p.location || "Central",
    size_sqm: Number(p.sizeSqm ?? p.size_sqm ?? 150),
    n_floors: Number(p.Nfloors ?? p.n_floors ?? 1),
    budget: Number(p.budget ?? 0),
    timeline_months: Number(p.timelineMonths ?? p.timeline_months ?? 6),
    tech_needs: Array.isArray(p.techNeeds || p.tech_needs)
      ? (p.techNeeds || p.tech_needs)
      : []
  };

  //------------------------------- Start of Proxy addition -------------------------------
  const realDB = new RealDatabaseHandler();
  const db = new ProxyDatabaseHandler(realDB, true);
  //-------------------------------------------- End of Proxy addition -------------------------------

  const { data, error } = await db.saveProject(payload);

  if (error) throw error;
  return data;
}
