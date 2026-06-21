import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

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
import useAuth from "@/hooks/UseAuth";
import { useTheme } from "next-themes";

// firstly schema
const loginSchema = z.object({
  email: z.string().email().lowercase(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  role: z.string().min(1, "Please select a role"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { token, login, user } = useAuth();

  if (token && user) {
    const dashboardPath =
      user.role === "Admin"
        ? "/admin/dashboard"
        : user.role === "Teacher"
          ? "/teacher/dashboard"
          : "/student/dashboard";
    return <Navigate to={dashboardPath} />;
  }

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "",
    },
  });

  const onSubmit = async (data) => {
    console.log(data);

    const newData = {
      email: data.email,
      password: data.password,
      role: data.role,
    };

    try {
      const response = await api.post("/users/login", newData);
      console.log(response);

      if (response.data.success) {
        toast.success("Login successfully");
        login(response.data.user, response.data.token);
        const dashboardPath =
          response.data.user.role === "Admin"
            ? "/admin/dashboard"
            : response.data.user.role === "Teacher"
              ? "/teacher/dashboard"
              : "/student/dashboard";
        navigate(dashboardPath);
      } else {
        toast.error("Login failed, Try again");
      }
    } catch (error) {
      console.log("login failed", error);
      toast.error("Login failed, try again");
    }
  };
   const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isDark = mounted
    ? (theme === "system" ? systemTheme : theme) === "dark"
    : true

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#AAC4F5] px-4 py-16">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
        <Card>
        
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold">LOGIN PAGE</CardTitle>
            <CardDescription className="text-center">
              School Management System gives opportunity to access you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="school@example.com"
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                  <select
                    id={field.name}
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select your role</option>
                    <option value="Admin">Admin</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                  </select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </CardContent>
          <CardFooter className={"block"}>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Logging in..." : "Login"}
            </button>
            <div className=" text-center mt-3 ">
              Forgot Your Password ?
              <Link to="/forgot-password" className="text-blue-500 underline ml-4">Forget Password</Link>
            </div>
          </CardFooter>
      
        </Card>
      </form>
    </div>
  );
};

export default LoginPage;
