"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { apiFetch } from "../lib/api";

export function ProofUploadForm({
  deliveryId,
  token,
  onUploaded,
}: {
  deliveryId: string;
  token: string;
  onUploaded: () => void;
}) {
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      if (file) {
        formData.append("photo", file);
      }

      formData.append("recipientName", recipientName);
      formData.append("notes", notes);
      formData.append("otpVerified", String(otpVerified));

      return apiFetch(`/deliveries/${deliveryId}/proof`, {
        method: "POST",
        token,
        body: formData,
      });
    },
    onSuccess: () => {
      onUploaded();
      setRecipientName("");
      setNotes("");
      setOtpVerified(false);
      setFile(null);
    },
  });

  return (
    <div className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4 text-lg font-semibold">Хүргэлтийн баталгаа оруулах</div>
      <div className="grid gap-3">
        <input
          className="input-field"
          placeholder="Хүлээн авагчийн нэр"
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
        />
        <textarea
          className="input-field min-h-28"
          placeholder="Хүргэлтийн тэмдэглэл"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={otpVerified} onChange={(event) => setOtpVerified(event.target.checked)} />
          OTP баталгаажсан
        </label>
      </div>
      <button onClick={() => mutation.mutate()} className="primary-button mt-4">
        {mutation.isPending ? "Илгээж байна..." : "Баталгаа илгээх"}
      </button>
    </div>
  );
}
