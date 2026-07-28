"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Lock, CheckCircle2 } from "lucide-react";

export function ProfileView() {
  const { user, updateUser } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setProfileSuccess("Profile updated successfully!");
      setProfileError(null);
    },
    onError: (err: any) => {
      setProfileError(err.error?.message || err.message || "Failed to update profile");
      setProfileSuccess(null);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: () => {
      setPasswordSuccess("Password changed successfully!");
      setPasswordError(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      setPasswordError(err.error?.message || err.message || "Failed to change password");
      setPasswordSuccess(null);
    },
  });

  if (!user) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    updateProfileMutation.mutate({
      fullName,
      email: email || null,
      phone: phone || null,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-sm text-slate-500">Manage your personal information, contact email, and security credentials</p>
      </div>

      <Card className="bg-white">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-3xl flex items-center justify-center shadow-md">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <Badge variant="default" className="uppercase text-[10px]">
                {user.role.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm font-mono text-slate-500">@{user.username}</p>
            {user.nim && (
              <p className="text-xs text-slate-600 font-medium">Student ID (NIM): {user.nim}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Personal Details
            </CardTitle>
            <CardDescription className="text-xs">Update your profile display name and contact details</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileSubmit}>
            <CardContent className="space-y-4">
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                  {profileError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Username (Account Identifier)</label>
                <Input value={`@${user.username}`} disabled className="bg-slate-50 font-mono text-xs" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address (Optional Contact)</label>
                <Input type="email" placeholder="user@university.ac.id" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone Number (Optional)</label>
                <Input placeholder="08123456789" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" isLoading={updateProfileMutation.isPending}>
                Save Profile
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" /> Security & Password
            </CardTitle>
            <CardDescription className="text-xs">Update your account password</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordSubmit}>
            <CardContent className="space-y-4">
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-md font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium">
                  {passwordError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Current Password</label>
                <Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">New Password</label>
                <Input type="password" placeholder="At least 8 chars with 1 uppercase & 1 number" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="secondary" className="w-full" isLoading={changePasswordMutation.isPending}>
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
