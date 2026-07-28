"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { laboratoryService, Laboratory } from "@/services/laboratory.service";
import { userService } from "@/services/user.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, BookOpen, Edit2, Shield } from "lucide-react";

export function LaboratoriesView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [adminId, setAdminId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["laboratories", page],
    queryFn: () => laboratoryService.listLaboratories(page, 9),
  });

  const { data: labAdmins } = useQuery({
    queryKey: ["lab-admins"],
    queryFn: () => userService.listUsers({ role: "LAB_ADMIN", limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: laboratoryService.createLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to create laboratory");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => laboratoryService.updateLab(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to update laboratory");
    },
  });

  const assignAdminMutation = useMutation({
    mutationFn: ({ labId, adminId }: { labId: string; adminId: string }) =>
      laboratoryService.assignAdmin(labId, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratories"] });
    },
  });

  const openCreateModal = () => {
    setEditingLab(null);
    setName("");
    setCode("");
    setDescription("");
    setAdminId("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lab: Laboratory) => {
    setEditingLab(lab);
    setName(lab.name);
    setCode(lab.code);
    setDescription(lab.description || "");
    setAdminId(lab.adminId || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLab(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !code) {
      setFormError("Laboratory Name and Code are required.");
      return;
    }

    if (editingLab) {
      updateMutation.mutate({
        id: editingLab.id,
        payload: { name, code, description },
      });
      if (adminId && adminId !== editingLab.adminId) {
        assignAdminMutation.mutate({ labId: editingLab.id, adminId });
      }
    } else {
      createMutation.mutate({ name, code, description, adminId: adminId || undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">University Laboratories</h1>
          <p className="text-sm text-slate-500">Manage laboratory facilities and assigned Laboratory Administrators</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Laboratory
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48 bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50 p-6 text-red-700 text-sm font-medium">
          {(error as Error)?.message || "Failed to load laboratory directory"}
        </Card>
      )}

      {data && (
        <>
          {data.data.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">No Laboratories Defined</p>
              <p className="text-xs text-slate-500 mt-1">Click "Add Laboratory" to create your first laboratory facility.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((lab) => (
                <Card key={lab.id} className="flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border-blue-200">
                        {lab.code}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(lab)} className="h-8 w-8 p-0">
                        <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{lab.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {lab.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Assigned Lab Admin</p>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {lab.admin?.fullName || "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" /> {lab._count?.practicums ?? 0} Practicums
                      </span>
                      <span>Added {new Date(lab.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">{editingLab ? "Edit Laboratory" : "Add New Laboratory"}</CardTitle>
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
                  <label className="text-xs font-semibold text-slate-700">Laboratory Code *</label>
                  <Input placeholder="e.g. LAB-FIS" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Laboratory Name *</label>
                  <Input placeholder="e.g. Basic Physics Laboratory" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <Input placeholder="Facility description..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Assign Lab Admin</label>
                  <select
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- No Admin Assigned --</option>
                    {labAdmins?.data.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.fullName} (@{admin.username})
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingLab ? "Save Changes" : "Create Laboratory"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
