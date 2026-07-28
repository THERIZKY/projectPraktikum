"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionService, Submission } from "@/services/submission.service";
import { useAuthStore } from "@/stores/auth.store";
import { SubmissionStatus } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SubmissionsView() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [reviewStatus, setReviewStatus] = useState<SubmissionStatus>("ACCEPTED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["submissions", "my"],
    queryFn: () => submissionService.listMySubmissions(),
    enabled: !!user,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: SubmissionStatus; notes?: string }) =>
      submissionService.reviewSubmission(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      closeReviewModal();
    },
    onError: (err: any) => {
      setReviewError(err.error?.message || err.message || "Failed to review submission");
    },
  });

  const openReviewModal = (s: Submission) => {
    setReviewingSubmission(s);
    setReviewStatus(s.status || "ACCEPTED");
    setReviewNotes(s.reviewNotes || "");
    setReviewError(null);
  };

  const closeReviewModal = () => {
    setReviewingSubmission(null);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;
    reviewMutation.mutate({
      id: reviewingSubmission.id,
      status: reviewStatus,
      notes: reviewNotes,
    });
  };

  const getStatusBadgeVariant = (status: SubmissionStatus) => {
    if (status === "ACCEPTED") return "success";
    if (status === "REJECTED" || status === "REVISION_REQUESTED") return "destructive";
    if (status === "LATE") return "warning";
    if (status === "SUBMITTED") return "default";
    return "secondary";
  };

  if (!user) return null;

  const isReviewer = user.role === "ASSISTANT" || user.role === "LAB_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assignment Submissions</h1>
          <p className="text-sm text-slate-500">
            {isReviewer
              ? "Review student submission files, provide feedback, and accept/request revisions"
              : "Track your submitted assignment reports and view assistant feedback"}
          </p>
        </div>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          {isLoading && <div className="p-8 text-center text-sm text-slate-500">Loading submissions...</div>}

          {isError && (
            <div className="p-8 text-center text-sm text-red-600 font-medium">
              {(error as Error)?.message || "Failed to load submission records"}
            </div>
          )}

          {data && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Assignment</th>
                    {isReviewer && <th className="px-6 py-3.5">Student</th>}
                    <th className="px-6 py-3.5">Submitted At</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Review Notes</th>
                    {isReviewer && <th className="px-6 py-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={isReviewer ? 6 : 4} className="px-6 py-8 text-center text-slate-500 text-sm">
                        No submission records found.
                      </td>
                    </tr>
                  ) : (
                    data.data.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{sub.assignment?.title || "Assignment"}</p>
                          <p className="text-xs text-slate-400 font-mono">{sub.assignment?.type}</p>
                        </td>
                        {isReviewer && (
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-900">{sub.studentEnrollment?.student?.fullName || "Student"}</p>
                            <p className="text-xs text-slate-500 font-mono">@{sub.studentEnrollment?.student?.username}</p>
                          </td>
                        )}
                        <td className="px-6 py-4 text-xs">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "Not submitted"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={getStatusBadgeVariant(sub.status)}>
                            {sub.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                          {sub.reviewNotes || "—"}
                        </td>
                        {isReviewer && (
                          <td className="px-6 py-4 text-right">
                            <Button variant="outline" size="sm" onClick={() => openReviewModal(sub)}>
                              Review
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

      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <Card className="w-full max-w-md shadow-xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
              <CardTitle className="text-lg">Review Submission</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeReviewModal}>✕</Button>
            </CardHeader>

            <form onSubmit={handleReviewSubmit}>
              <CardContent className="space-y-4 pt-4">
                {reviewError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                    {reviewError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Review Decision *</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as SubmissionStatus)}
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACCEPTED">Accept Submission</option>
                    <option value="REVISION_REQUESTED">Request Revision</option>
                    <option value="REJECTED">Reject Submission</option>
                    <option value="UNDER_REVIEW">Mark Under Review</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Feedback / Review Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Provide constructive feedback for the student..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeReviewModal}>Cancel</Button>
                <Button type="submit" isLoading={reviewMutation.isPending}>Submit Review</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
