"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit-log.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AuditLogView() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: () => auditLogService.listAuditLogs(page, 15),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
        <p className="text-sm text-slate-500">Immutable security logs of administrative actions, grade changes, and system modifications</p>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          {isLoading && <div className="p-8 text-center text-sm text-slate-500">Loading audit records...</div>}

          {isError && (
            <div className="p-8 text-center text-sm text-red-600 font-medium">
              {(error as Error)?.message || "Failed to load audit logs"}
            </div>
          )}

          {data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Action Event</th>
                      <th className="px-6 py-3.5">Entity Target</th>
                      <th className="px-6 py-3.5">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {data.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm font-sans">
                          No audit events recorded.
                        </td>
                      </tr>
                    ) : (
                      data.data.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-sans">
                            <p className="font-semibold text-slate-900">{log.user?.fullName || "System / Unauthenticated"}</p>
                            {log.user?.role && (
                              <Badge variant="secondary" className="text-[9px] uppercase mt-0.5">
                                {log.user.role}
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="font-bold text-blue-700 bg-blue-50 border-blue-200">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {log.entityType} ({log.entityId ? log.entityId.slice(0, 8) + "..." : "N/A"})
                          </td>
                          <td className="px-6 py-4 text-slate-400">{log.ipAddress || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-slate-200 text-xs text-slate-500 font-sans">
                <div>
                  Page <span className="font-semibold text-slate-900">{data.meta.page}</span> of{" "}
                  <span className="font-semibold text-slate-900">{data.meta.totalPages}</span> ({data.meta.total} Events)
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
