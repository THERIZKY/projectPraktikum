"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradingService, StudentGradeSummary } from "@/services/grading.service";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GraduationCap } from "lucide-react";

export function GradesView() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [classId, setClassId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentGradeSummary | null>(null);
  const [inputComponentId, setInputComponentId] = useState("");
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const { data: gradesData, isLoading, isError, error } = useQuery({
    queryKey: ["class-grades", classId],
    queryFn: () => gradingService.getClassGrades(classId),
    enabled: !!classId,
  });

  const inputGradeMutation = useMutation({
    mutationFn: gradingService.inputGrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-grades", classId] });
      closeInputModal();
    },
    onError: (err: any) => {
      setModalError(err.error?.message || err.message || "Failed to save score");
    },
  });

  const openInputModal = (student: StudentGradeSummary) => {
    setSelectedStudent(student);
    setInputComponentId(student.componentScores[0]?.componentId || "");
    setScore(0);
    setFeedback("");
    setModalError(null);
  };

  const closeInputModal = () => {
    setSelectedStudent(null);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !inputComponentId) return;

    inputGradeMutation.mutate({
      studentEnrollmentId: selectedStudent.studentEnrollmentId,
      gradingComponentId: inputComponentId,
      score,
      feedback,
    });
  };

  if (!user) return null;

  const isAssistant = user.role === "ASSISTANT" || user.role === "LAB_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Grades & Evaluation Matrix</h1>
          <p className="text-sm text-slate-500">
            {isAssistant
              ? "Input component scores, track student progress, and calculate final letter grades"
              : "View your calculated component scores and final academic grade"}
          </p>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Enter Class Section ID:</label>
          <Input
            placeholder="e.g. paste Class ID UUID to view matrix..."
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="flex-1"
          />
        </CardContent>
      </Card>

      {!classId ? (
        <Card className="p-12 text-center text-slate-500 bg-white">
          <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-900">No Class Selected</p>
          <p className="text-xs text-slate-500 mt-1">Please enter a valid Class ID above to display student evaluation matrix.</p>
        </Card>
      ) : (
        <Card className="bg-white">
          <CardContent className="p-0">
            {isLoading && <div className="p-8 text-center text-sm text-slate-500">Calculating weighted scores...</div>}

            {isError && (
              <div className="p-8 text-center text-sm text-red-600 font-medium">
                {(error as Error)?.message || "Failed to load grade evaluation matrix"}
              </div>
            )}

            {gradesData && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Student</th>
                      <th className="px-6 py-3.5">NIM</th>
                      <th className="px-6 py-3.5">Component Scores</th>
                      <th className="px-6 py-3.5">Final Score</th>
                      <th className="px-6 py-3.5">Grade</th>
                      {isAssistant && <th className="px-6 py-3.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gradesData.length === 0 ? (
                      <tr>
                        <td colSpan={isAssistant ? 6 : 5} className="px-6 py-8 text-center text-slate-500 text-sm">
                          No enrolled students found in this class section.
                        </td>
                      </tr>
                    ) : (
                      gradesData.map((row) => (
                        <tr key={row.studentEnrollmentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">{row.student.fullName}</p>
                            <p className="text-xs text-slate-400 font-mono">@{row.student.username}</p>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-700">{row.student.nim || "—"}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {row.componentScores.map((c) => (
                                <Badge key={c.componentId} variant="secondary" className="text-[10px]">
                                  {c.componentName}: {c.rawScore}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{row.finalScore}</td>
                          <td className="px-6 py-4">
                            {row.letterGrade ? (
                              <Badge variant="success" className="font-bold">
                                {row.letterGrade}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-slate-500">Unpublished</Badge>
                            )}
                          </td>
                          {isAssistant && (
                            <td className="px-6 py-4 text-right">
                              <Button variant="outline" size="sm" onClick={() => openInputModal(row)}>
                                Input Score
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Input Component Score</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeInputModal}>✕</Button>
            </CardHeader>

            <form onSubmit={handleInputSubmit}>
              <CardContent className="space-y-4 pt-4">
                {modalError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                    {modalError}
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Student</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedStudent.student.fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">NIM: {selectedStudent.student.nim || selectedStudent.student.username}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Grading Component *</label>
                  <select
                    value={inputComponentId}
                    onChange={(e) => setInputComponentId(e.target.value)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {selectedStudent.componentScores.map((c) => (
                      <option key={c.componentId} value={c.componentId}>
                        {c.componentName} ({(c.weight * 100).toFixed(0)}% weight)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Raw Score (0 - 100) *</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Feedback / Comments</label>
                  <Input placeholder="Optional notes..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeInputModal}>Cancel</Button>
                <Button type="submit" isLoading={inputGradeMutation.isPending}>Save Score</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
