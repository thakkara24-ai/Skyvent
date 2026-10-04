import React, { useState, useEffect } from 'react';
import { dashboardService, extractDataArray } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await dashboardService.getAuditLogs();
      setLogs(extractDataArray(res));
    } catch {
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
          System Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
          Immutable history of sensitive actions including logins, ticket cancellations, and expense approvals
        </p>
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A6A5E]">
            No audit records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Initiated By</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Metadata</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8F5]/80">
                    <td className="py-3 px-4 font-mono font-bold text-[#6B4A38]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#2A1E18]">
                      {log.entity} #{log.entity_id || ''}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2A1E18]">{log.user_name}</div>
                      <div className="text-[10px] text-[#7A6A5E]">{log.user_email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="coffee" size="sm">{log.user_role}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#7A6A5E] max-w-xs truncate">
                      {JSON.stringify(log.metadata)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#7A6A5E] font-mono text-[11px]">
                      {format(new Date(log.timestamp), 'MMM d, yyyy • h:mm:ss a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
