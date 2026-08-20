import React from "react";
import { Leaf, User, LogOut, ShieldAlert, Sparkles, ClipboardList } from "lucide-react";

export default function Navbar({ user, activeTab, setActiveTab, onLogout, onOpenAuth }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("reports")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent">
                EcoCampus
              </span>
              <span className="block text-[10px] tracking-wider text-slate-400 font-semibold uppercase">
                Smart Sustainability
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "reports"
                  ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{user?.role === "Student" || user?.role === "student" ? "My Reports" : "Report Desk"}</span>
            </button>

            {(user?.role === "Admin" || user?.role === "admin" || user?.role === "Manager" || user?.role === "manager") && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Operations</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === "ai"
                  ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs border border-emerald-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AI Policy & Agent</span>
            </button>
          </nav>

          {/* User Profile & Auth Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</div>
                  <span
                    className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      user.role === "Admin" || user.role === "admin"
                        ? "bg-rose-100 text-rose-700"
                        : user.role === "Manager" || user.role === "manager"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
