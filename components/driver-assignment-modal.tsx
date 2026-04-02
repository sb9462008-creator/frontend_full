"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { apiFetch } from "../lib/api";
import { translateLabel } from "../lib/labels";
import type { Driver } from "../lib/types";

export function DriverAssignmentModal({
  open,
  token,
  deliveryId,
  onClose,
  onAssigned,
}: {
  open: boolean;
  token: string;
  deliveryId: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [driverId, setDriverId] = useState("");

  const driversQuery = useQuery({
    queryKey: ["drivers", "assign"],
    enabled: open,
    queryFn: () => apiFetch<Driver[]>("/drivers", { token }),
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/deliveries/${deliveryId}/assign-driver`, {
        method: "POST",
        token,
        body: JSON.stringify({ driverId }),
      }),
    onSuccess: () => {
      onAssigned();
      onClose();
    },
  });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6">
      <div className="glass-panel w-full max-w-lg rounded-[2rem] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="eyebrow">Оноолт</div>
            <h3 className="mt-2 text-2xl font-semibold">Курьер оноох</h3>
          </div>
          <button onClick={onClose} className="secondary-button">
            Хаах
          </button>
        </div>

        <select
          value={driverId}
          onChange={(event) => setDriverId(event.target.value)}
          className="input-field"
        >
          <option value="">Курьер сонгох</option>
          {driversQuery.data?.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.name} · {translateLabel(driver.status)}
            </option>
          ))}
        </select>

        <button
          onClick={() => assignMutation.mutate()}
          disabled={!driverId || assignMutation.isPending}
          className="primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {assignMutation.isPending ? "Оноож байна..." : "Курьер оноох"}
        </button>
      </div>
    </div>
  );
}
