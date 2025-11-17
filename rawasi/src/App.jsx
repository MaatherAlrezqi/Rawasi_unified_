import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import rawasiLogo from "./assets/photo_2025-08-13_21-03-51.png";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { OtpModal, ForgotModal } from "./components/Modals.jsx";
import FlowProgress from "./components/Progress.jsx";

import Landing from "./pages/Landing.jsx";
import Project from "./pages/Project.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import Messages from "./pages/Messages.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

// Provider pages
import ProviderDashboard from "./provider/pages/ProviderDashboard.jsx";
import ProviderProjects from "./provider/pages/ProviderProjects.jsx";
import ProviderRequests from "./provider/pages/ProviderRequests.jsx";
import ProviderMessages from "./provider/pages/ProviderMessages.jsx";
import ProviderReports from "./provider/pages/ProviderReports.jsx";
import ProviderProfile from "./provider/pages/ProviderProfile.jsx";

import { loadLS, saveLS, uid } from "./lib/utils.js";
import { seedUsers } from "./lib/auth.js";
import { supabase } from "./lib/supabase";

// ---- Guards ---------------------------------------------------------------

const RequireProject = ({ project, children }) =>
  project ? children : <Navigate to="/project" replace />;

const RequireAuth = ({ children }) => children;

const RequireRole = ({ role, children, auth }) => {
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  if (auth.role !== role) {
    // Redirect to the correct area based on actual role
    if (auth.role === "provider") {
      return <Navigate to="/provider/dashboard" replace />;
    }
    // Default: project owner
    return <Navigate to="/project" replace />;
  }

  return children;
};

// ---- App ------------------------------------------------------------------

export default function App() {
  // Project flow state
  const [project, setProject] = useState(null);

  // Auth state - load from localStorage on mount
  const [auth, setAuth] = useState(() => loadLS("rawasi_auth", null));
  
  // Keep old users state for backward compatibility (registration)
  const [users, setUsers] = useState(() => loadLS("rawasi_users", seedUsers()));
  
  const [otpModal, setOtpModal] = useState({ open: false, email: "" });
  const [forgotModal, setForgotModal] = useState({ open: false });

  const navigate = useNavigate();
  const location = useLocation();

  // Persist auth state
  useEffect(() => saveLS("rawasi_auth", auth), [auth]);
  useEffect(() => saveLS("rawasi_users", users), [users]);

  // Check for existing Supabase session on mount
  useEffect(() => {
    checkSupabaseSession();
  }, []);

  // Function to check if user is already logged in via Supabase
  const checkSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !auth) {
        // User has active Supabase session but no app auth state
        console.log("Restoring session for:", session.user.email);
        
        // Get profile to determine role
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const userRole = profile?.role || session.user.user_metadata?.role || "owner";

        const authData = {
          id: session.user.id,
          email: session.user.email,
          role: userRole,
          name: profile?.name || profile?.full_name || session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          phone: profile?.phone || session.user.user_metadata?.phone || "",
        };

        setAuth(authData);
        localStorage.setItem("rawasi_auth", JSON.stringify(authData));
      }
    } catch (error) {
      console.error("Session check error:", error);
    }
  };

  // Request notification permission on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show progress only on flow routes (not on Landing or Dashboard)
  const showFlowProgress = ["/project", "/recs", "/messages"].some((p) =>
    location.pathname.startsWith(p)
  );

  // Detect provider area for layout (optional)
  const isProviderArea = location.pathname.startsWith("/provider");

  // ---- Auth handlers -------------------------------------------------------

  function handleRegister(payload) {
    if (
      users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())
    ) {
      return { ok: false, error: "Email already registered" };
    }
    const newUser = { id: uid(), ...payload, createdAt: Date.now() };
    setUsers((prev) => [...prev, newUser]);
    setOtpModal({ open: true, email: payload.email });
    return { ok: true };
  }

  function verifyOtp(code) {
    if (!/^[0-9]{6}$/.test(code)) {
      return { ok: false, error: "Enter 6 digits" };
    }
    setOtpModal({ open: false, email: "" });
    navigate("/login");
    return { ok: true };
  }

  function handleLogin({ email, password }) {
    // This is now just for setting app state
    // Actual authentication happens in Login.jsx via Supabase
    
    // Get auth data from localStorage (set by Login.jsx)
    const authData = JSON.parse(localStorage.getItem("rawasi_auth") || "null");
    
    if (authData) {
      console.log("Setting auth state:", authData);
      setAuth(authData);
      return { ok: true };
    }

    // Fallback: check old localStorage users for backward compatibility
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );
    
    if (user) {
      const legacyAuthData = {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
      };
      
      setAuth(legacyAuthData);
      
      if (legacyAuthData.role === "provider") {
        navigate("/provider/dashboard");
      } else {
        navigate("/project");
      }
      
      return { ok: true };
    }

    return { ok: false, error: "Invalid credentials" };
  }

  async function logout() {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear app state
    setAuth(null);
    localStorage.removeItem("rawasi_auth");
    localStorage.removeItem("user");
    localStorage.removeItem("profile");
    
    // Redirect to landing
    navigate("/");
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Header is hidden on provider area if you want full-screen provider UI */}
      {!isProviderArea && (
        <Header logoUrl={rawasiLogo} auth={auth} onLogout={logout} />
      )}

      <main className="mx-auto max-w-7xl px-4 pt-2 flex-1 w-full">
        {showFlowProgress && <FlowProgress />}

        <Routes>
          {/* Landing */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route
            path="/login"
            element={
              <Login
                onSubmit={handleLogin}
                onForgot={() => setForgotModal({ open: true })}
              />
            }
          />
          <Route
            path="/register"
            element={<Register onSubmit={handleRegister} />}
          />

          {/* Project Owner Flow */}
          <Route
            path="/project"
            element={
              <Project
                logoUrl={rawasiLogo}
                onComplete={(p) => {
                  setProject(p);
                  navigate("/recs");
                }}
              />
            }
          />
          <Route
            path="/recs"
            element={
              <RequireProject project={project}>
                <Recommendations project={project} />
              </RequireProject>
            }
          />
          <Route
            path="/messages"
            element={<Messages onProceed={() => navigate("/dashboard")} />}
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                project={project}
                onStartProject={() => navigate("/project")}
              />
            }
          />
          <Route
            path="/my-requests"
            element={
              <RequireAuth>
                <MyRequests />
              </RequireAuth>
            }
          />

          {/* Provider Portal */}
          <Route
            path="/provider/dashboard"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/provider/projects"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderProjects />
              </RequireRole>
            }
          />
          <Route
            path="/provider/requests"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderRequests />
              </RequireRole>
            }
          />
          <Route
            path="/provider/messages"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderMessages />
              </RequireRole>
            }
          />
          <Route
            path="/provider/reports"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderReports />
              </RequireRole>
            }
          />
          <Route
            path="/provider/profile"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderProfile />
              </RequireRole>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modals always available */}
      <OtpModal
        open={otpModal.open}
        email={otpModal.email}
        onClose={() => setOtpModal({ open: false, email: "" })}
        onVerify={verifyOtp}
      />
      <ForgotModal
        open={forgotModal.open}
        onClose={() => setForgotModal({ open: false })}
      />

      {/* Footer hidden for provider area too */}
      {!isProviderArea && <Footer logoUrl={rawasiLogo} />}
    </div>
  );
}
