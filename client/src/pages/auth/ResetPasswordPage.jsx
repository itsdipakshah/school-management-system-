import api from "@/api/axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const resetSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters long"),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [isTokenValid, setIsTokenValid] = useState(true);
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }

    try {
      const response = await api.put(`/users/password/reset/${token}`, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.data?.success) {
        toast.success(response.data.message || "Password reset successfully.");
        navigate("/login");
      } else {
        toast.error(response.data?.message || "Unable to reset password.");
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Unable to reset password.";
      toast.error(message);
    }
  };

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              The password reset link is missing or invalid. Please request a new reset link from the forgot password page.
            </p>
          </CardContent>
          <CardFooter>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
              Request New Link
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-4 py-16">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold">RESET PASSWORD</CardTitle>
            <CardDescription className="text-center">
              Enter your new password to complete the reset process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="New password"
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
          <CardFooter>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
