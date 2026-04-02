"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { getDefaultRouteForRole, persistAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

export default function CustomerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const signupMutation = useMutation({
    mutationFn: () =>
      apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: (result) => {
      persistAuth(result);
      router.push(getDefaultRouteForRole(result.user.role));
    },
    onError: (mutationError) => {
      setError(mutationError.message);
    },
  });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-84px)] max-w-4xl items-center px-6 py-12">
      <div className="glass-panel w-full rounded-[2rem] p-8">
        <div className="eyebrow">Customer Signup</div>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--text)]">Хэрэглэгч бүртгүүлэх</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Компьютерийн сэлбэг захиалж, захиалга үүссэн мөчөөс хүргэлтийн явцаа харахын тулд бүртгэл үүсгэнэ үү.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            className="input-field"
            placeholder="Нэр"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="input-field"
            placeholder="И-мэйл"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <input
            className="input-field md:col-span-2"
            type="password"
            placeholder="Нууц үг"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </div>

        {error ? <div className="mt-4 text-sm text-[var(--red)]">{error}</div> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => signupMutation.mutate()} className="primary-button">
            {signupMutation.isPending ? "Бүртгэл үүсгэж байна..." : "Бүртгүүлэх"}
          </button>
          <Link href="/login" className="secondary-button">
            Нэвтрэх хэсэг рүү буцах
          </Link>
        </div>
      </div>
    </main>
  );
}
