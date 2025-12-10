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
import OwnerRequests from "./pages/OwnerRequests.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

// Provider pages
import ProviderDashboard from "./provider/pages/ProviderDashboard.jsx";
import ProviderProjects from "./provider/pages/ProviderProjects.jsx";
import ProviderRequests from "./provider/pages/ProviderRequests.jsx";
import ProviderMessages from "./provider/pages/ProviderMessages.jsx";
import ProviderReports from "./provider/pages/ProviderReports.jsx";
import ProviderProfile from "./provider/pages/ProviderProfile.jsx";

import { loadLS, saveLS } from "./lib/utils.js";
import { supabase } from "./lib/supabase";
import { userFactory } from "./lib/factories/UserFactory"; // ✅ Import factory

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

  const [otpModal, setOtpModal] = useState({ open: false, email: "" });
  const [forgotModal, setForgotModal] = useState({ open: false });

  // ✅ Store for user instances created by factory
  const [userInstances, setUserInstances] = useState(() =>
    loadLS("rawasi_user_instances", {})
  );

  const navigate = useNavigate();
  const location = useLocation();

  // Persist auth state and user instances
  useEffect(() => saveLS("rawasi_auth", auth), [auth]);
  useEffect(
    () => saveLS("rawasi_user_instances", userInstances),
    [userInstances]
  );

  // Check for existing Supabase session on mount
  useEffect(() => {
    checkSupabaseSession();
  }, []);

  // Function to check if user is already logged in via Supabase
  const checkSupabaseSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && !auth) {
        console.log("Restoring session for:", session.user.email);

        // Get profile to determine role
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        const userRole =
          profile?.role || session.user.user_metadata?.role || "owner";

        // ✅ Recreate user instance from stored data using factory
        const userData = {
          id: session.user.id,
          email: session.user.email,
          role: userRole,
          name:
            profile?.name ||
            session.user.user_metadata?.name ||
            session.user.email.split("@")[0],
          phone: profile?.phone || session.user.user_metadata?.phone || "",
          password: "", // We don't store passwords
          ...profile, // Include all profile data
        };

        // Create user instance via factory
        const userInstance = userFactory.createUser(userData);

        // Store instance
        setUserInstances((prev) => ({
          ...prev,
          [session.user.id]: userInstance,
        }));

        const authData = {
          id: session.user.id,
          email: session.user.email,
          role: userInstance.role,
          name: userInstance.firstName + " " + userInstance.lastName,
          phone: userInstance.phoneNumber,
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
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show progress only on flow routes
  const showFlowProgress = ["/project", "/recs", "/messages"].some((p) =>
    location.pathname.startsWith(p)
  );

  // Detect provider area for layout
  const isProviderArea = location.pathname.startsWith("/provider");

  // ---- Auth handlers -------------------------------------------------------

  /**
   * ✅ Updated registration handler to work with Factory Pattern
   */
  function handleRegister(payload) {
    try {
      // The factory-created user instance is passed from Register.jsx
      const { userInstance, ...userData } = payload;

      if (!userInstance) {
        console.error("No user instance provided from factory");
        return { ok: false, error: "User creation failed" };
      }

      // Store the user instance
      setUserInstances((prev) => ({
        ...prev,
        [userData.id]: userInstance,
      }));

      console.log("✅ User registered via Factory Pattern:", userInstance);
      console.log("User role:", userInstance.role);
      console.log("User type:", userInstance.constructor.name);

      // Navigate to verification
      setOtpModal({ open: true, email: userData.email });

      return { ok: true };
    } catch (error) {
      console.error("Registration error in App:", error);
      return { ok: false, error: error.message };
    }
  }

  function verifyOtp(code) {
    if (!/^[0-9]{6}$/.test(code)) {
      return { ok: false, error: "Enter 6 digits" };
    }
    setOtpModal({ open: false, email: "" });
    navigate("/login");
    return { ok: true };
  }

  /**
   * ✅ Updated login handler
   */
  function handleLogin({ email, password }) {
    // Auth is handled in Login.jsx via Supabase
    // This just sets app state

    const authData = JSON.parse(localStorage.getItem("rawasi_auth") || "null");

    if (authData) {
      console.log("Setting auth state:", authData);
      setAuth(authData);

      // ✅ Get or create user instance for this session
      let userInstance = userInstances[authData.id];

      if (!userInstance) {
        // Recreate from stored data
        try {
          userInstance = userFactory.createUser({
            ...authData,
            password: "", // Don't store password
          });

          setUserInstances((prev) => ({
            ...prev,
            [authData.id]: userInstance,
          }));

          console.log("✅ User instance recreated on login:", userInstance);
        } catch (error) {
          console.error("Error recreating user instance:", error);
        }
      }

      return { ok: true };
    }

    return { ok: false, error: "Invalid credentials" };
  }

  /**
   * ✅ Get current user instance
   */
  function getCurrentUserInstance() {
    if (!auth) return null;
    return userInstances[auth.id];
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
                userInstance={getCurrentUserInstance()}
              />
            }
          />
          <Route
            path="/my-requests"
            element={
              <RequireAuth>
                <MyRequests userInstance={getCurrentUserInstance()} />
              </RequireAuth>
            }
          />
          <Route
            path="/owner-requests"
            element={
              <RequireAuth>
                <OwnerRequests userInstance={getCurrentUserInstance()} />
              </RequireAuth>
            }
          />

          {/* Provider Portal */}
          <Route
            path="/provider/dashboard"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderDashboard userInstance={getCurrentUserInstance()} />
              </RequireRole>
            }
          />
          <Route
            path="/provider/projects"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderProjects userInstance={getCurrentUserInstance()} />
              </RequireRole>
            }
          />
          <Route
            path="/provider/requests"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderRequests userInstance={getCurrentUserInstance()} />
              </RequireRole>
            }
          />
          <Route
            path="/provider/messages"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderMessages userInstance={getCurrentUserInstance()} />
              </RequireRole>
            }
          />
          <Route
            path="/provider/reports"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderReports userInstance={getCurrentUserInstance()} />
              </RequireRole>
            }
          />
          <Route
            path="/provider/profile"
            element={
              <RequireRole role="provider" auth={auth}>
                <ProviderProfile userInstance={getCurrentUserInstance()} />
              </RequireRole>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modals */}
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

      {!isProviderArea && <Footer logoUrl={rawasiLogo} />}
    </div>
  );
}
