"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, CreateUserPayload } from "@/services/user.service";
import { UserRole, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, UserCheck, UserX, Edit2 } from "lucide-react";

export function UsersView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<CreateUserPayload>({
    username: "",
    fullName: "",
    password: "",
    role: "STUDENT",
    nim: "",
    email: "",
    phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", page, search, roleFilter],
    queryFn: () =>
      userService.listUsers({
        page,
        limit: 10,
        search: search || undefined,
        role: (roleFilter as UserRole) || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => userService.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to update user");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.toggleUserStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      fullName: "",
      password: "",
      role: "STUDENT",
      nim: "",
      email: "",
      phone: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName,
      password: "",
      role: user.role,
      nim: user.nim || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingUser) {
      const updatePayload: any = {
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        nim: formData.nim || null,
        email: formData.email || null,
        phone: formData.phone || null,
      };
      updateMutation.mutate({ id: editingUser.id, payload: updatePayload });
    } else {
      if (!formData.fullName || (!formData.username && !formData.nim) || !formData.password) {
        setFormError("Full Name, Password, and Username (or NIM) are required.");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    if (role === "SYSTEM_ADMIN") return "destructive";
    if (role === "LAB_ADMIN") return "default";
    if (role === "ASSISTANT") return "warning";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System User Directory</h1>
          <p className="text-sm text-slate-500">Manage all accounts, administrative roles, and active statuses</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Username, Name, NIM, or Email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | "");
              setPage(1);
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
            <option value="LAB_ADMIN">Lab Admin</option>
            <option value="ASSISTANT">Assistant</option>
            <option value="STUDENT">Student</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && <div className="p-8 text-center text-sm text-slate-500">Loading user records...</div>}

          {isError && (
            <div className="p-8 text-center text-sm text-red-600 font-medium">
              {(error as Error)?.message || "Failed to load user directory"}
            </div>
          )}

          {data && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">User</th>
                      <th className="px-6 py-3.5">Username / NIM</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Contact Email</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                          No users found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      data.data.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{user.fullName}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            <span className="font-semibold text-slate-800">@{user.username}</span>
                            {user.nim && <span className="text-slate-400 ml-1">({user.nim})</span>}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs">{user.email || "—"}</td>
                          <td className="px-6 py-4">
                            {user.isActive ? (
                              <Badge variant="success" className="flex w-fit items-center gap-1">
                                <UserCheck className="h-3 w-3" /> Active
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="flex w-fit items-center gap-1">
                                <UserX className="h-3 w-3" /> Deactivated
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              className="h-8 px-2 text-slate-600"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant={user.isActive ? "outline" : "secondary"}
                              size="sm"
                              onClick={() =>
                                toggleStatusMutation.mutate({ id: user.id, isActive: !user.isActive })
                              }
                              className="h-8 px-2 text-xs"
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-slate-200 text-xs text-slate-500">
                <div>
                  Page <span className="font-semibold text-slate-900">{data.meta.page}</span> of{" "}
                  <span className="font-semibold text-slate-900">{data.meta.totalPages}</span> ({data.meta.total} Total Users)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= data.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">
                {editingUser ? "Edit User Account" : "Create New User Account"}
              </CardTitle>
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
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <Input
                    placeholder="e.g. Dr. Budi Santoso"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Role *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="STUDENT">Student (Praktikan)</option>
                      <option value="ASSISTANT">Assistant (Asprak)</option>
                      <option value="LAB_ADMIN">Lab Admin</option>
                      <option value="SYSTEM_ADMIN">System Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {formData.role === "STUDENT" || formData.role === "ASSISTANT" ? "Student ID (NIM) *" : "Username *"}
                    </label>
                    <Input
                      placeholder={formData.role === "STUDENT" || formData.role === "ASSISTANT" ? "e.g. 221511001" : "e.g. labfisika"}
                      value={formData.role === "STUDENT" || formData.role === "ASSISTANT" ? formData.nim : formData.username}
                      onChange={(e) => {
                        if (formData.role === "STUDENT" || formData.role === "ASSISTANT") {
                          setFormData({ ...formData, nim: e.target.value, username: e.target.value });
                        } else {
                          setFormData({ ...formData, username: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Initial Password *</label>
                    <Input
                      type="password"
                      placeholder="At least 8 chars with 1 uppercase & 1 number"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email (Optional Contact)</label>
                    <Input
                      type="email"
                      placeholder="e.g. user@university.ac.id"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Phone (Optional)</label>
                    <Input
                      placeholder="e.g. 08123456789"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingUser ? "Save Changes" : "Create Account"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
