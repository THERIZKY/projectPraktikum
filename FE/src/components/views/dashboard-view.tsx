"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { dashboardService } from "@/services/dashboard.service";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, BookOpen, Clock, FileText, CheckCircle2 } from "lucide-react";

export function DashboardView() {
  const user = useAuthStore((state) => state.user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", user?.role],
    queryFn: () => dashboardService.getDashboardData(user!.role),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user.fullName}!
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Signed in as <span className="font-semibold text-white">@{user.username}</span> ({user.role.replace("_", " ")})
            </p>
          </div>
          <Badge variant="secondary" className="w-fit px-3 py-1 text-xs font-semibold bg-white/20 text-white border-white/30 backdrop-blur-md">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </Badge>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-slate-100 rounded-t-xl" />
              <CardContent className="h-12 bg-slate-50 rounded-b-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700 text-sm font-medium">
            Failed to load dashboard data: {(error as Error)?.message || "Unknown error"}
          </CardContent>
        </Card>
      )}

      {/* Data Loaded */}
      {data && (
        <>
          {/* SYSTEM_ADMIN Stats */}
          {user.role === "SYSTEM_ADMIN" && data.stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Total System Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{data.stats.totalUsers}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.stats.totalStudents} Students, {data.stats.totalAssistants} Assistants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Active Laboratories</CardTitle>
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{data.stats.totalLabs}</div>
                  <p className="text-xs text-slate-500 mt-1">System managed facilities</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Active Practicums</CardTitle>
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{data.stats.totalPracticums}</div>
                  <p className="text-xs text-slate-500 mt-1">Current academic term</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* LAB_ADMIN Stats */}
          {user.role === "LAB_ADMIN" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Lab Practicums</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{data.stats?.practicums ?? 0}</div>
                  <p className="text-xs text-slate-500 mt-1">Managed practicum courses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Enrolled Students</CardTitle>
                  <Users className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{data.stats?.totalStudents ?? 0}</div>
                  <p className="text-xs text-slate-500 mt-1">Active lab enrollments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{data.stats?.pendingSubmissions ?? 0}</div>
                  <p className="text-xs text-slate-500 mt-1">Submissions awaiting grading</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ASSISTANT Stats */}
          {user.role === "ASSISTANT" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Assigned Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{data.assignedClasses?.length ?? 0}</div>
                    <p className="text-xs text-slate-500 mt-1">Class sections assigned</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Pending Submissions</CardTitle>
                    <FileText className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{data.pendingSubmissions ?? 0}</div>
                    <p className="text-xs text-slate-500 mt-1">Requires review & feedback</p>
                  </CardContent>
                </Card>
              </div>

              {/* Assigned Classes List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assigned Class Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.assignedClasses?.length === 0 ? (
                    <p className="text-sm text-slate-500">No practicum classes currently assigned.</p>
                  ) : (
                    data.assignedClasses?.map((item: any) => (
                      <div key={item.classId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{item.className}</p>
                          <p className="text-xs text-slate-500">{item.practicum.code} — {item.practicum.name}</p>
                        </div>
                        <Badge variant="secondary">{item.studentCount} Students</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* STUDENT Stats */}
          {user.role === "STUDENT" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Enrolled Practicums
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.enrolledPracticums?.length === 0 ? (
                    <p className="text-sm text-slate-500">You are not currently enrolled in any practicum classes.</p>
                  ) : (
                    data.enrolledPracticums?.map((item: any) => (
                      <div key={item.enrollmentId} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">{item.practicum.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.practicum.code} • {item.className}</p>
                        </div>
                        {item.publishedGrade ? (
                          <div className="text-right">
                            <Badge variant="success" className="text-sm font-bold">
                              {item.publishedGrade.letterGrade || item.publishedGrade.finalScore}
                            </Badge>
                            <p className="text-[10px] text-slate-500 mt-0.5">Final Grade</p>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-slate-500">In Progress</Badge>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.upcomingDeadlines?.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      No pending assignment deadlines!
                    </div>
                  ) : (
                    data.upcomingDeadlines?.map((d: any) => (
                      <div key={d.id} className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60">
                        <p className="font-semibold text-xs text-amber-950">{d.title}</p>
                        <p className="text-[10px] text-amber-800 mt-1">
                          Due: {new Date(d.deadline).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
