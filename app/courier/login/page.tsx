"use client";

import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { clearAuth, getDefaultRouteForRole, persistAuth, useStoredAuth } from "@/lib/auth";
import type { AuthResponse } from "@/lib/types";

export default function DriverPortalLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { auth } = useStoredAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth) {
      router.replace(getDefaultRouteForRole(auth.user.role));
    }
  }, [auth, router]);

  const loginMutation = useMutation({
    mutationFn: () =>
      apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (result) => {
      clearAuth();
      queryClient.clear();
      persistAuth(result);
      router.push(getDefaultRouteForRole(result.user.role));
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-84px)] max-w-3xl items-center px-6 py-12">
      <div className="glass-panel w-full rounded-[2rem] p-8">
        <div className="eyebrow">Driver Login</div>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--text)]">Курьераар нэвтрэх</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Оноогдсон хүргэлтээ удирдах, төлөв шинэчлэх, баталгаа оруулах, шууд байршлаа хуваалцахын тулд нэвтэрнэ үү.
        </p>
        <div className="mt-6 grid gap-4">
          <input className="input-field" placeholder="И-мэйл" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input
            className="input-field"
            placeholder="Нууц үг"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <div className="text-sm text-[var(--red)]">{error}</div> : null}
          <button onClick={() => loginMutation.mutate()} className="primary-button">
            {loginMutation.isPending ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </button>
          <Link href="/courier/signup" className="secondary-button text-center">
            Курьер эрх үүсгэх
          </Link>
        </div>
      </div>
    </main>
  );
}
