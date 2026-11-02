'use client';

/**
 * @file team-roles/page.tsx
 * @description Role-Based Access Control (RBAC) & Staff Management.
 * Requires Enterprise Plan to unlock!
 */

import React, { useState } from 'react';
import LockedFeatureGate from '@/components/LockedFeatureGate';
import { ShieldCheck, Plus } from 'lucide-react';

export default function TeamRolesPage() {
  const [staff, setStaff] = useState([
    { name: 'Avery Morgan', email: 'admin@synvorait.com', role: 'Super Admin (Full P&L & Settings Access)' },
    { name: 'Rahim Uddin', email: 'rahim@synvorait.com', role: 'Order & Courier Fulfillment Manager' },
    { name: 'Nadia Islam', email: 'nadia@synvorait.com', role: 'Social Studio & Inbox Moderator' },
  ]);

  return (
    <LockedFeatureGate
      title="Unlock Multi-Staff Team & Role Permissions"
      description="Invite moderators, order managers, and accountants with granular role-based permissions and activity audit logs."
      requiredPlan="Enterprise"
      benefits={[
        'Separate access roles for Social Media Moderators, Order Fulfillment Staff, and Accountants.',
        'Restrict financial P&L visibility strictly to store owners.',
        'Track employee performance and daily order handling metrics.',
      ]}
    >
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" /> Team Members & Role Permissions (RBAC)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Control which employees can access Orders, Social Inbox, or Financial P&L reports.
            </p>
          </div>
          <button
            onClick={() =>
              setStaff([...staff, { name: 'New Staff Member', email: 'staff@synvorait.com', role: 'Social Inbox Moderator' }])
            }
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Invite Staff Member
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role & Access Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s, i) => (
                <tr key={i}>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.email}</td>
                  <td className="py-3 px-4 font-semibold text-blue-600">{s.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LockedFeatureGate>
  );
}