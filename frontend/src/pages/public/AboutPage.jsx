import React from 'react';
import { ShieldCheck, Database, Cpu, Layers, GitBranch, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';

export const AboutPage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#6B4A38]/10 text-[#6B4A38] text-xs font-bold uppercase tracking-widest">
          Platform Architecture
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2A1E18] tracking-tight">
          About SKYVENT
        </h1>
        <p className="text-base text-[#7A6A5E] leading-relaxed">
          SKYVENT is an end-to-end student organization management platform built specifically to replace disjointed spreadsheets, paper ticket receipts, and manual payment tracking with a single unified, secure system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#6B4A38]/10 text-[#6B4A38]">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#2A1E18]">Pure SQLite & Django ORM</h3>
          </div>
          <p className="text-xs text-[#7A6A5E] leading-relaxed">
            All data flows through Django REST Framework models with relational integrity. Membership dates, ticket inventory, merchandise stock, and accounting balances are calculated on the backend—never trusting frontend overrides.
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#8B6353]/10 text-[#8B6353]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#2A1E18]">Realtime Channels & WebSockets</h3>
          </div>
          <p className="text-xs text-[#7A6A5E] leading-relaxed">
            Live updates across devices. When a volunteer scans a ticket at the door, the administrative attendance counter increments instantly in real time without refreshing.
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#2A1E18]/10 text-[#2A1E18]">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#2A1E18]">Real OTP & Role Permissions</h3>
          </div>
          <p className="text-xs text-[#7A6A5E] leading-relaxed">
            Secure 6-digit cryptographically hashed OTP verification with 5-minute expiry and attempt limiting. Granular permissions for Super Admins, Presidents, Treasurers, Volunteers, and Members.
          </p>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#2A1E18]">Connected Workflow Model</h3>
          </div>
          <p className="text-xs text-[#7A6A5E] leading-relaxed">
            Memberships unlock member prices. Ticket purchases generate financial income records. Check-in logs attendance. Merchandise orders automatically decrement stock and trigger low-stock alerts.
          </p>
        </Card>
      </div>
    </div>
  );
};
