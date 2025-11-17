import { supabase } from "../lib/supabaseClient";

/** Save a minimal/draft project and return the inserted row */
export async function saveDraftProject(p) {
  // must be logged in
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  if (!user) throw new Error("You must be logged in");

  // build payload that matches your public.projects schema
  const payload = {
    user_id: user.id,
    name: p.name || "Untitled project",
    type: p.type || "Residential",
    location: p.location || "Central",
    size_sqm: Number(p.sizeSqm ?? p.size_sqm ?? 150),
    n_floors: Number(p.Nfloors ?? p.n_floors ?? 1),
    budget: Number(p.budget ?? 0),
    timeline_months: Number(p.timelineMonths ?? p.timeline_months ?? 6),
    tech_needs: Array.isArray(p.techNeeds || p.tech_needs) ? (p.techNeeds || p.tech_needs) : []
  };

  const { data, error } = await supabase
    .from("projects")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data; // includes data.id
}
