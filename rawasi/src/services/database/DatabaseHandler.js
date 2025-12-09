// src/provider/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import ProviderSidebar from "./ProviderSidebar";

// ======================
//  Database Proxy Imports
// ======================
import RealDatabaseHandler from "../../services/database/RealDatabaseHandler";
import ProxyDatabaseHandler from "../../services/database/ProxyDatabaseHandler";

// إنشاء نسخة من الـ Proxy
const realDB = new RealDatabaseHandler();
const database = new ProxyDatabaseHandler(realDB, true); // true = logging enabled

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================
  //   Load User
  // ==========================
  const loadUser = async () => {
    const { data, error } = await window.supabase.auth.getUser(); 
    if (error) console.error("Auth Error:", error);
    setUser(data?.user || null);
  };

  // ==========================
  //   Load Projects via Proxy
  // ==========================
  const loadProjects = async (userId) => {
    const { data, error } = await database
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading projects:", error);
      return;
    }

    setProjects(data || []);
  };

  useEffect(() => {
    (async () => {
      await loadUser();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (user) {
      loadProjects(user.id);
    }
  }, [user]);

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="flex">
      <ProviderSidebar />

      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-4">Provider Dashboard</h1>

        {projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg shadow-sm bg-white"
              >
                <h2 className="font-bold text-lg">{project.title}</h2>
                <p className="text-sm text-gray-600">{project.description}</p>
                <p className="text-xs mt-2 text-gray-400">
                  {new Date(project.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
