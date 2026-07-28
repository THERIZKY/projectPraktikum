"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { practicumService, Practicum } from "@/services/practicum.service";
import { laboratoryService } from "@/services/laboratory.service";
import { useAuthStore } from "@/stores/auth.store";
import { Semester } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Building2, Layers, Edit2 } from "lucide-react";

export function PracticumsView() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [filterAcademicYear, setFilterAcademicYear] = useState("2026/2027");
  const [filterSemester, setFilterSemester] = useState<Semester | "">("ODD");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPracticum, setEditingPracticum] = useState<Practicum | null>(null);

  const [laboratoryId, setLaboratoryId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [formAcademicYear, setFormAcademicYear] = useState("2026/2027");
  const [formSemester, setFormSemester] = useState<Semester>("ODD");
  const [totalSessions, setTotalSessions] = useState(14);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["practicums", filterAcademicYear, filterSemester],
    queryFn: () => practicumService.listPracticums(filterAcademicYear || undefined, (filterSemester as Semester) || undefined),
  });

  const { data: labs } = useQuery({
    queryKey: ["laboratories-dropdown"],
    queryFn: () => laboratoryService.listLaboratories(1, 100),
    enabled: user?.role === "SYSTEM_ADMIN" || user?.role === "LAB_ADMIN",
  });

  const createMutation = useMutation({
    mutationFn: practicumService.createPracticum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practicums"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to create practicum");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => practicumService.updatePracticum(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practicums"] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.error?.message || err.message || "Failed to update practicum");
    },
  });

  const openCreateModal = () => {
    setEditingPracticum(null);
    setLaboratoryId(labs?.data[0]?.id || "");
    setName("");
    setCode("");
    setDescription("");
    setFormAcademicYear("2026/2027");
    setFormSemester("ODD");
    setTotalSessions(14);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Practicum) => {
    setEditingPracticum(p);
    setLaboratoryId(p.laboratoryId);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description || "");
    setFormAcademicYear(p.academicYear);
    setFormSemester(p.semester);
    setTotalSessions(p.totalSessions);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPracticum(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !code || (!editingPracticum && !laboratoryId)) {
      setFormError("Laboratory, Practicum Name, and Code are required.");
      return;
    }

    if (!formSemester || (formSemester !== "ODD" && formSemester !== "EVEN")) {
      setFormError("Please select a valid Semester (ODD or EVEN).");
      return;
    }

    if (editingPracticum) {
      updateMutation.mutate({
        id: editingPracticum.id,
        payload: {
          name,
          code,
          description,
          academicYear: formAcademicYear,
          semester: formSemester,
          totalSessions,
        },
      });
    } else {
      createMutation.mutate({
        laboratoryId,
        name,
        code,
        description,
        academicYear: formAcademicYear,
        semester: formSemester,
        totalSessions,
      });
    }
  };

  const isManagementAllowed = user?.role === "SYSTEM_ADMIN" || user?.role === "LAB_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Practicum Courses</h1>
          <p className="text-sm text-slate-500">View and manage laboratory practicums, sections, and grading modules</p>
        </div>
        {isManagementAllowed && (
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Practicum
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-slate-500">Academic Year</label>
            <select
              value={filterAcademicYear}
              onChange={(e) => setFilterAcademicYear(e.target.value)}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-slate-500">Semester</label>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value as Semester | "")}
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Semesters</option>
              <option value="ODD">Odd (Ganjil)</option>
              <option value="EVEN">Even (Genap)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48 bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-red-200 bg-red-50 p-6 text-red-700 text-sm font-medium">
          {(error as Error)?.message || "Failed to load practicum list"}
        </Card>
      )}

      {data && (
        <>
          {data.data.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-900">No Practicums Found</p>
              <p className="text-xs text-slate-500 mt-1">No active practicums match the selected academic year and semester.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.data.map((p) => (
                <Card key={p.id} className="flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                        {p.code}
                      </Badge>
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {p.semester} {p.academicYear}
                        </Badge>
                        {isManagementAllowed && (
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(p)} className="h-7 w-7 p-0">
                            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{p.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {p.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-medium truncate">{p.laboratory?.name || "Facility Lab"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                        <span>{p.totalSessions} Meetings</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                        <span>{p._count?.classes ?? 0} Class Sections</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">{editingPracticum ? "Edit Practicum" : "Create Practicum Course"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>✕</Button>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                    {formError}
                  </div>
                )}

                {!editingPracticum && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Laboratory Facility *</label>
                    <select
                      value={laboratoryId}
                      onChange={(e) => setLaboratoryId(e.target.value)}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {labs?.data.map((lab) => (
                        <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Course Code *</label>
                    <Input placeholder="e.g. FIS-101" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Total Meetings</label>
                    <Input type="number" min={1} max={20} value={totalSessions} onChange={(e) => setTotalSessions(Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Academic Year *</label>
                    <select
                      value={formAcademicYear}
                      onChange={(e) => setFormAcademicYear(e.target.value)}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2026/2027">2026/2027</option>
                      <option value="2025/2026">2025/2026</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Semester *</label>
                    <select
                      value={formSemester}
                      onChange={(e) => setFormSemester(e.target.value as Semester)}
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ODD">Odd (Ganjil)</option>
                      <option value="EVEN">Even (Genap)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Description</label>
                  <Input placeholder="Course objective..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingPracticum ? "Save Changes" : "Create Practicum"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
