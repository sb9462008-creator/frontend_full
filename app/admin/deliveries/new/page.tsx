"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SectionShell } from "@/components/section-shell";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import type { Delivery } from "@/lib/types";

export default function CreateDeliveryPage() {
  const router = useRouter();
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");
  const [form, setForm] = useState({
    pickupAddress: "",
    pickupLat: "",
    pickupLng: "",
    dropoffAddress: "",
    dropoffLat: "",
    dropoffLng: "",
    scheduledAt: "",
    eta: "",
    notes: "",
  });
  const [locationError, setLocationError] = useState<string | null>(null);

  const setCurrentLocation = (target: "pickup" | "dropoff") => {
    if (!navigator.geolocation) {
      setLocationError("Энэ браузер байршил тогтоох боломжийг дэмжихгүй байна.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          [`${target}Lat`]: position.coords.latitude.toFixed(6),
          [`${target}Lng`]: position.coords.longitude.toFixed(6),
        }));
        setLocationError(null);
      },
      () => {
        setLocationError("Таны одоогийн байршлыг уншиж чадсангүй. Браузерын зөвшөөрлөө шалгана уу.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.pickupLat.trim() || !form.pickupLng.trim() || !form.dropoffLat.trim() || !form.dropoffLng.trim()) {
        throw new Error("Авах болон хүргэх координатууд заавал шаардлагатай.");
      }

      return apiFetch<Delivery>("/deliveries", {
        method: "POST",
        token: auth?.accessToken,
        body: JSON.stringify({
          pickupAddress: form.pickupAddress,
          pickupLat: Number(form.pickupLat),
          pickupLng: Number(form.pickupLng),
          dropoffAddress: form.dropoffAddress,
          dropoffLat: Number(form.dropoffLat),
          dropoffLng: Number(form.dropoffLng),
          scheduledAt: form.scheduledAt || undefined,
          eta: form.eta || undefined,
          notes: form.notes || undefined,
        }),
      });
    },
    onSuccess: (delivery) => {
      router.push(`/admin/deliveries/${delivery.id}`);
    },
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  return (
    <SectionShell
      eyebrow="Хүргэлт үүсгэх"
      title="Шинэ хүргэлт үүсгэх"
      description="Авах, хүргэх байршил, хуваарь, тооцоолсон хүрэх цаг болон тэмдэглэлийг серверийн хатуу координатын шалгалттайгаар оруулна."
      actions={
        <Link href="/admin/deliveries" className="secondary-button">
          Жагсаалт руу буцах
        </Link>
      }
    >
      <div className="glass-panel rounded-[2rem] p-6">
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Анхны Сүхбаатарын талбайн жишээ координатуудыг хассан. Жинхэнэ авах/хүргэх координатаа оруулах эсвэл доорх байршлын товчийг ашиглана уу.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Авах хаяг", "pickupAddress"],
            ["Авах цэгийн өргөрөг", "pickupLat"],
            ["Авах цэгийн уртраг", "pickupLng"],
            ["Хүргэх хаяг", "dropoffAddress"],
            ["Хүргэх цэгийн өргөрөг", "dropoffLat"],
            ["Хүргэх цэгийн уртраг", "dropoffLng"],
            ["Товлосон цаг", "scheduledAt"],
            ["Тооцоолсон хүрэх цаг", "eta"],
          ].map(([label, key]) => (
            <div key={key}>
              <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
              <input
                className="input-field"
                type={key.includes("At") || key === "eta" ? "datetime-local" : "text"}
                placeholder={
                  key === "pickupLat" ? "47.918400" :
                  key === "pickupLng" ? "106.917700" :
                  key === "dropoffLat" ? "47.922100" :
                  key === "dropoffLng" ? "106.934500" :
                  undefined
                }
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCurrentLocation("pickup")}
            className="secondary-button"
          >
            Миний байршлыг авах цэгт ашиглах
          </button>
          <button
            type="button"
            onClick={() => setCurrentLocation("dropoff")}
            className="secondary-button"
          >
            Миний байршлыг хүргэх цэгт ашиглах
          </button>
        </div>
        {locationError ? <div className="mt-3 text-sm text-red-600">{locationError}</div> : null}
        {createMutation.error instanceof Error ? (
          <div className="mt-3 text-sm text-red-600">{createMutation.error.message}</div>
        ) : null}

        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">Тэмдэглэл</div>
          <textarea
            className="input-field min-h-32"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        <button onClick={() => createMutation.mutate()} className="primary-button mt-6">
          {createMutation.isPending ? "Үүсгэж байна..." : "Хүргэлт үүсгэх"}
        </button>
      </div>
    </SectionShell>
  );
}
