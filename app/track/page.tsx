"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SectionShell } from "@/components/section-shell";

export default function TrackPage() {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState("");

  return (
    <SectionShell
      eyebrow="Tracking"
      title="Хүргэлт хайх"
      description="Хяналтын код эсвэл захиалгын дугаар оруулаад хүргэлтийн шууд төлөв, маршрут, хүрэх хугацааг хараарай."
    >
      <div className="glass-panel rounded-[2rem] p-6">
        <div className="mb-3 rounded-2xl border border-[rgba(207,35,45,0.28)] bg-[rgba(207,35,45,0.12)] px-4 py-3 text-sm text-[var(--text)]">
          Жишээ хяналтын код: <span className="font-semibold">TRACK-DEMO-1001</span>
          <div className="mt-2 text-xs text-[var(--muted)]">
            Энэ жишээ нь seed өгөгдлийн координат ашиглаж байна. Жинхэнэ хүргэлтүүд үүсгэх үедээ оруулсан координат болон курьерын GPS шинэчлэлтийг ашиглана.
          </div>
        </div>
        <input
          className="input-field"
          placeholder="Хяналтын код эсвэл захиалгын дугаар"
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
        />
        <button
          onClick={() => router.push(`/track/${trackingCode}`)}
          className="primary-button mt-4"
          disabled={!trackingCode}
        >
          Хайж эхлэх
        </button>
      </div>
    </SectionShell>
  );
}
