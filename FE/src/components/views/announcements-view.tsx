"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementService } from "@/services/announcement.service";
import { laboratoryService } from "@/services/laboratory.service";
import { useAuthStore } from "@/stores/auth.store";
import { AnnouncementPriority } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Pin, Trash2 } from "lucide-react";

export function AnnouncementsView() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [laboratoryId, setLaboratoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("NORMAL");
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["announcements", page],
    queryFn: () => announcementService.listAnnouncements(page, 10),
  });

  const { data: labs } = useQuery({
    queryKey: ["laboratories-announcement"],
    queryFn: () => laboratoryService.listLaboratories(1, 100),
    enabled: user?.role === "SYSTEM_ADMIN" || user?.role === "LAB_ADMIN",
  });

  const createMutation = useMutation({
    mutationFn: announcementService.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to post announcement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: announcementService.deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const openCreateModal = () => {
    setLaboratoryId(labs?.data[0]?.id || "");
    setTitle("");
    setContent("");
    setPriority("NORMAL");
    setIsPinned(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title || !content || !laboratoryId) {
      setFormError("Laboratory, Title, and Content are required.");
      return;
    }

    createMutation.mutate({
      laboratoryId,
      title,
      content,
      priority,
      isPinned,
    });
  };

  const getPriorityBadgeVariant = (p: AnnouncementPriority) => {
    if (p === "URGENT" || p === "HIGH") return "destructive";
    if (p === "NORMAL") return "default";
    return "secondary";
  };

  if (!user) return null;

  const isPublisher = user.role === "LAB_ADMIN" || user.role === "SYSTEM_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Announcements & Notices</h1>
          <p className="text-sm text-slate-500">Laboratory updates, schedule changes, and practicum notices</p>
        </div>
        {isPublisher && (
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Post Announcement
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-32 bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50 p-6 text-red-700 text-sm font-medium">
          {(error as Error)?.message || "Failed to load announcements"}
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          {data.data.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 bg-white">
              <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">No Announcements Posted</p>
              <p className="text-xs text-slate-500 mt-1">There are no active laboratory announcements at this time.</p>
            </Card>
          ) : (
            data.data.map((ann) => (
              <Card key={ann.id} className={ann.isPinned ? "border-blue-300 bg-blue-50/20" : "bg-white"}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <Badge variant="default" className="flex items-center gap-1 text-[10px]">
                          <Pin className="h-3 w-3 fill-current" /> Pinned
                        </Badge>
                      )}
                      <Badge variant={getPriorityBadgeVariant(ann.priority)} className="text-[10px]">
                        {ann.priority}
                      </Badge>
                    </div>
                    {isPublisher && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(ann.id)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-1">{ann.title}</CardTitle>
                  <p className="text-xs text-slate-400">
                    Posted by <span className="font-semibold text-slate-700">{ann.publisher?.fullName || "Admin"}</span> • {new Date(ann.publishedAt).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="text-sm text-slate-700 whitespace-pre-wrap">
                  {ann.content}
                </CardContent>
              </Card>
            ))
          )}

          {data.meta.totalPages > 1 && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Post Announcement</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>✕</Button>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                    {formError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Target Laboratory *</label>
                  <select
                    value={laboratoryId}
                    onChange={(e) => setLaboratoryId(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {labs?.data.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Title *</label>
                  <Input placeholder="Announcement title..." value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isPinned" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Pin to Top of List
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Content *</label>
                  <textarea
                    rows={4}
                    placeholder="Announcement description and details..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending}>Publish</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
