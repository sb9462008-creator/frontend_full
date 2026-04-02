"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { getDefaultRouteForRole, persistAuth } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";
import type { AuthResponse } from "@/lib/types";

export default function CourierSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const signupMutation = useMutation({
    mutationFn: () =>
      apiFetch<AuthResponse>("/auth/register-driver", {
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
        <h1 className="text-4xl font-semibold">Курьер бүртгүүлэх</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Оноогдсон хүргэлт хүлээж авах, шууд байршил хуваалцах, хүргэлтийн баталгаа оруулах курьер эрх үүсгэнэ үү.
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
            placeholder="Утас"
            value={form.phone}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => setForm((current) => ({ ...current, phone: normalizePhoneNumber(event.target.value) }))}
          />
          <input
            className="input-field md:col-span-2"
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

        {error ? <div className="mt-4 text-sm text-rose-600">{error}</div> : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => signupMutation.mutate()} className="primary-button">
            {signupMutation.isPending ? "Курьер эрх үүсгэж байна..." : "Курьер эрх үүсгэх"}
          </button>
          <Link href="/courier/login" className="secondary-button">
            Курьерын нэвтрэх рүү буцах
          </Link>
        </div>
      </div>
    </main>
  );
}
