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
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const ForgotPage = () => {
  const form = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post("/users/password/forgot", { email: data.email });
      if (response.data?.success) {
        toast.success(response.data.message || "Password reset email sent.");
        form.reset();
      } else {
        toast.error(response.data?.message || "Unable to send reset email.");
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || "Unable to send reset email.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-4 py-16">
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold">FORGET PASSWORD</CardTitle>
            <CardDescription className="text-center">
              Enter your email to receive a password reset link.
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
              {form.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default ForgotPage;
