"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

const loginSchema = z.object({
  username: z.string().min(1, "Username / NIM is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authService.login(data);
      setAuth(response.tokens, response.user);
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.error?.message || err.message || "Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border-slate-200 bg-white">
      <CardHeader className="text-center space-y-1">
        <div className="mx-auto bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mb-2 shadow-xs">
          PMS
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Sign In</CardTitle>
        <CardDescription>
          Enter your Username or Student ID (NIM) to access your practicum workspace
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Username / NIM</label>
            <Input
              placeholder="e.g. 221511001 or labadmin"
              autoComplete="username"
              error={errors.username?.message}
              {...register("username")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
          <div className="text-xs text-center text-slate-500">
            Having trouble? Contact your Laboratory Administrator.
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
