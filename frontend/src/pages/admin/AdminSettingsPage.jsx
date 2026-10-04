import React from 'react';
import { Mail, Database, Terminal } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminSettingsPage = () => {

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          Platform Configuration & System Health
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Backend server settings, email SMTP gateways, and environment diagnostics
        </p>
      </div>

      <div className="space-y-4">
        <Card padding="lg">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8DCCE] mb-4">
            <Database className="w-5 h-5 text-[#6B4A38]" />
            <h3 className="text-base font-bold text-[#2A1E18]">Database Engine</h3>
          </div>
          <div className="space-y-2 text-xs text-[#7A6A5E]">
            <div className="flex justify-between">
              <span>Database Engine:</span>
              <strong className="text-[#2A1E18]">SQLite 3 (Django ORM Isolated)</strong>
            </div>
            <div className="flex justify-between">
              <span>Database Storage Path:</span>
              <strong className="font-mono text-[#2A1E18]">backend/db.sqlite3</strong>
            </div>
            <div className="flex justify-between">
              <span>Integrity Constraints:</span>
              <Badge variant="success" size="sm">✓ Enforced by Foreign Keys & Transactions</Badge>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8DCCE] mb-4">
            <Mail className="w-5 h-5 text-[#8B6353]" />
            <h3 className="text-base font-bold text-[#2A1E18]">Email Gateway & OTP Delivery</h3>
          </div>
          <div className="space-y-2 text-xs text-[#7A6A5E]">
            <div className="flex justify-between">
              <span>Configured Backend:</span>
              <strong className="text-[#2A1E18]">Django Email Backend (Console/SMTP)</strong>
            </div>
            <div className="flex justify-between">
              <span>OTP Expiry Policy:</span>
              <strong className="text-[#2A1E18]">5 Minutes (Cryptographic Hash SHA-256)</strong>
            </div>
            <div className="flex justify-between">
              <span>Attempt Limit:</span>
              <strong className="text-[#2A1E18]">Maximum 5 Attempts per code</strong>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8DCCE] mb-4">
            <Terminal className="w-5 h-5 text-[#2A1E18]" />
            <h3 className="text-base font-bold text-[#2A1E18]">Realtime Channels & WebSockets</h3>
          </div>
          <div className="space-y-2 text-xs text-[#7A6A5E]">
            <div className="flex justify-between">
              <span>Channel Layer:</span>
              <strong className="text-[#2A1E18]">Django Channels (InMemoryChannelLayer)</strong>
            </div>
            <div className="flex justify-between">
              <span>WebSocket Route:</span>
              <strong className="font-mono text-[#2A1E18]">/ws/live/</strong>
            </div>
            <div className="flex justify-between">
              <span>Live Streams:</span>
              <span className="text-emerald-700 font-semibold">Attendance, Tickets, Inventory, Finance</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
