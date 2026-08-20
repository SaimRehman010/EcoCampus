import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AIAssistant from "./components/AIAssistant";
import AuthModal from "./components/AuthModal";
import { Leaf } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("reports"); // 'reports' | 'admin' | 'ai'
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("ecocampus_user");
    const savedToken = localStorage.getItem("ecocampus_token");
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ecocampus_token");
    localStorage.removeItem("ecocampus_user");
    setUser(null);
    setActiveTab("reports");
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    if (userData.role === "Admin" || userData.role === "Manager") {
      setActiveTab("admin");
    } else {
      setActiveTab("reports");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-eco-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Views */}
      <main className="flex-1">
        {activeTab === "reports" && (
          <StudentDashboard
            user={user}
            onRequireAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === "admin" && (
          <AdminDashboard user={user} />
        )}

        {activeTab === "ai" && (
          <AIAssistant />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <Leaf className="w-4 h-4 text-eco-600" />
            <span className="font-semibold text-slate-700">EcoCampus Sustainability Platform</span>
          </div>
          <p>© 2026 EcoCampus Initiative. Integrated MERN + Python Microservices Suite.</p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
