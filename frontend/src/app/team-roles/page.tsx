"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  KeyRound,
  Mail,
  X,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  emailOrPhone: string;
  roleTitle: string;
  isAdmin: boolean;
  allowedModules: string[];
  status: "Active" | "Suspended";
  addedAt: string;
}

const ALL_MODULES = [
  "Overview",
  "Orders & POS",
  "Products & Pricing",
  "Inventory & Returns",
  "Courier Fulfillment",
  "Customers CRM",
  "Unified Inbox (Chat)",
  "Social Studio",
  "Marketing & Ads",
  "Analytics & P&L",
  "Channels & Integrations",
  "Settings",
];

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "tm_owner",
    name: "Main Business Owner (Admin)",
    emailOrPhone: "admin@synvorait.com",
    roleTitle: "Super Admin (Full Access)",
    isAdmin: true,
    allowedModules: ALL_MODULES,
    status: "Active",
    addedAt: "Primary Owner",
  },
];

export default function TeamRolesPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmailPhone, setNewEmailPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleTitle, setNewRoleTitle] = useState("Order & Inbox Executive");
  const [selectedModules, setSelectedModules] = useState<string[]>([
    "Orders & POS",
    "Courier Fulfillment",
    "Unified Inbox (Chat)",
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("synvora_team_members_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
        }
      }
    } catch {}
  }, []);

  const persistMembers = (nextList: TeamMember[]) => {
    setMembers(nextList);
    localStorage.setItem("synvora_team_members_v2", JSON.stringify(nextList));
  };

  const toggleModulePermission = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmailPhone.trim()) return;

    const created: TeamMember = {
      id: `tm_${Date.now()}`,
      name: newName.trim(),
      emailOrPhone: newEmailPhone.trim(),
      roleTitle: newRoleTitle,
      isAdmin: newRoleTitle.toLowerCase().includes("admin"),
      allowedModules: selectedModules.length > 0 ? selectedModules : ["Orders & POS"],
      status: "Active",
      addedAt: new Date().toLocaleDateString(),
    };

    persistMembers([...members, created]);
    setNewName("");
    setNewEmailPhone("");
    setNewPassword("");
    setShowAddModal(false);
    triggerToast(`Staff member "${created.name}" added with custom role permissions!`);
  };

  const handleRemoveMember = (id: string) => {
    const nextList = members.filter((m) => m.id !== id);
    persistMembers(nextList);
    triggerToast("Team member removed.");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Team Members &amp; Staff Role Permissions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign specific tasks and page permissions to your moderators, inbox agents, fulfillment staff, or accountants while keeping Admin controls protected.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />+ Add Staff / Team Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{m.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {m.emailOrPhone}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    m.isAdmin
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {m.roleTitle}
                </span>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                  Allowed Pages &amp; Responsibilities:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.allowedModules.map((mod) => (
                    <span
                      key={mod}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      ✓ {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">{m.addedAt}</span>
              {!m.isAdmin && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(m.id)}
                  className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Staff Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Add Staff Member &amp; Assign Tasks</h3>
                <p className="text-xs text-slate-400">
                  Create login credentials and select which pages this user can access
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Login Email or Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmailPhone}
                    onChange={(e) => setNewEmailPhone(e.target.value)}
                    placeholder="staff@synvorait.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Role / Designation *
                  </label>
                  <select
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900"
                  >
                    <option value="Order & Inbox Executive">Order &amp; Inbox Executive</option>
                    <option value="Warehouse & Courier Manager">
                      Warehouse &amp; Courier Manager
                    </option>
                    <option value="Social Media & Ads Manager">
                      Social Media &amp; Ads Manager
                    </option>
                    <option value="Accountant (Analytics & P&L)">
                      Accountant (Analytics &amp; P&amp;L)
                    </option>
                    <option value="Co-Admin (Full Access)">Co-Admin (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Staff Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Select Allowed Modules (কোন কোন পেজে কাজ করতে পারবে):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map((mod) => (
                    <label
                      key={mod}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer font-semibold text-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(mod)}
                        onChange={() => toggleModulePermission(mod)}
                      />
                      <span>{mod}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}