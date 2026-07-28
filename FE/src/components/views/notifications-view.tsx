"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Circle } from "lucide-react";

export function NotificationsView() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.listNotifications(1, 50),
  });

  const markReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500">In-app alerts for grade releases, assignment deadlines, and system updates</p>
        </div>
        {data && data.data.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            isLoading={markAllReadMutation.isPending}
            className="flex items-center gap-1.5 text-xs"
          >
            <CheckCheck className="h-4 w-4" /> Mark All as Read
          </Button>
        )}
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          {isLoading && <div className="p-8 text-center text-sm text-slate-500">Loading notifications...</div>}

          {isError && (
            <div className="p-8 text-center text-sm text-red-600 font-medium">
              {(error as Error)?.message || "Failed to load notifications"}
            </div>
          )}

          {data && (
            <div className="divide-y divide-slate-100">
              {data.data.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900">No Notifications</p>
                  <p className="text-xs text-slate-500 mt-1">You have no unread or recent notifications.</p>
                </div>
              ) : (
                data.data.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                      !item.isRead ? "bg-blue-50/40" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!item.isRead ? (
                        <Circle className="h-2.5 w-2.5 fill-blue-600 text-blue-600 mt-1.5 flex-shrink-0" />
                      ) : (
                        <div className="h-2.5 w-2.5 mt-1.5 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-slate-900">{item.title}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {!item.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(item.id)}
                        className="text-xs h-8 text-blue-600 hover:text-blue-800"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
