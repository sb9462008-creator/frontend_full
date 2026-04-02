"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MapView } from "@/components/map-view";
import { PaymentSection, type PaymentDraft } from "@/components/payment-section";
import { SectionShell } from "@/components/section-shell";
import { apiFetch } from "@/lib/api";
import { clearBag, removeFromBag, updateBagQuantity, useBagItems } from "@/lib/bag";
import { isCustomerRole, useStoredAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { normalizePhoneNumber } from "@/lib/phone";
import { translateProductCategory } from "@/lib/product-copy";
import { addressLabels, cityOptions, geocodeShippingAddress } from "@/lib/shipping";
import type { Order } from "@/lib/types";

export default function BagPage() {
  const router = useRouter();
  const { auth } = useStoredAuth();
  const bagItems = useBagItems();
  const [addressLabel, setAddressLabel] = useState<(typeof addressLabels)[number]>("Гэр");
  const [city, setCity] = useState<(typeof cityOptions)[number]>("Улаанбаатар");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    source: "device" | "address";
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "searching" | "error">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    method: "CARD",
    isComplete: false,
    summary: "Төлбөр: Картаар төлөхөөр сонгосон",
  });

  const shippingAddress = [
    `${addressLabel} хаяг`,
    city,
    detailedAddress.trim(),
    `Хүлээн авагч: ${recipientFirstName.trim()} ${recipientLastName.trim()}`.trim(),
    `Утас: ${recipientPhone.trim()}`,
  ]
    .filter((value) => value.replace(/\s+/g, " ").trim().length > 0)
    .join(", ");

  const deliveryNotes = [
    `Хаягийн нэр: ${addressLabel}`,
    `Хүлээн авагч: ${recipientFirstName.trim()} ${recipientLastName.trim()}`.trim(),
    `Утас: ${recipientPhone.trim()}`,
    paymentDraft.summary,
  ]
    .filter((value) => value.replace(/\s+/g, " ").trim().length > 0)
    .join(" | ");

  const totalAmountCents = bagItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const canCheckout =
    !!auth &&
    isCustomerRole(auth.user.role) &&
    bagItems.length > 0 &&
    detailedAddress.trim().length > 0 &&
    recipientFirstName.trim().length > 0 &&
    recipientLastName.trim().length > 0 &&
    recipientPhone.trim().length > 0 &&
    paymentDraft.isComplete;

  const orderMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      setLocationError(null);
      setLocationStatus("searching");
      const shippingLocation =
        selectedLocation?.source === "device"
          ? selectedLocation
          : await geocodeShippingAddress(`Mongolia, ${shippingAddress}`);
      setLocationStatus("idle");

      return apiFetch<Order>("/orders", {
        method: "POST",
        token: auth?.accessToken,
        body: JSON.stringify({
          shippingAddress,
          shippingLat: shippingLocation.latitude,
          shippingLng: shippingLocation.longitude,
          notes: deliveryNotes || undefined,
          payment: paymentDraft.isComplete
            ? {
                method: paymentDraft.method,
                status: "COMPLETED",
                summary: paymentDraft.summary,
              }
            : undefined,
          items: bagItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });
    },
    onSuccess: (order) => {
      if (!order?.id) {
        setLocationStatus("error");
        setError("Захиалга амжилттай үүссэн эсэхийг тодорхойлж чадсангүй. Миний захиалгууд хэсгийг шалгаад дахин оролдоно уу.");
        return;
      }

      clearBag();
      router.push(`/orders/${order.id}`);
    },
    onError: (mutationError) => {
      setLocationStatus("error");
      setLocationError(mutationError.message);
      setError(mutationError.message);
    },
  });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Энэ браузер таны байршлыг тодорхойлох боломжгүй байна.");
      return;
    }

    setLocationStatus("searching");
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "device",
        });
        setLocationStatus("idle");
      },
      () => {
        setLocationStatus("error");
        setLocationError("Таны яг одоогийн байршлыг авч чадсангүй. Браузерын location зөвшөөрлөө шалгана уу.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  return (
    <SectionShell
      eyebrow="Сагс"
      title="Сагс"
      description=""
      actions={
        <div className="flex flex-wrap gap-3">
          <Link href="/shop" className="secondary-button">
            Дэлгүүр үргэлжлүүлэх
          </Link>
          {bagItems.length > 0 ? (
            <button type="button" onClick={() => clearBag()} className="secondary-button">
              Сагс хоослох
            </button>
          ) : null}
        </div>
      }
    >
      {bagItems.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-8 text-sm leading-7 text-[var(--muted)]">
          Сагсанд бараа алга байна. Дэлгүүрээс хүссэн бараануудаа нэмээд дахин орж ирээрэй.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-lg font-semibold text-[var(--text)]">Сагсанд байгаа бараанууд</div>
                <div className="text-sm text-[var(--muted)]">{bagItems.length} төрөл</div>
              </div>
              <div className="mt-5 space-y-4">
                {bagItems.map((item) => (
                  <div key={item.productId} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-[1rem] bg-[rgba(255,255,255,0.04)]">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <Link href={`/shop/${item.slug}`} className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">
                            {item.name}
                          </Link>
                          <div className="mt-1 text-sm text-[var(--muted)]">{translateProductCategory(item.category)}</div>
                          <div className="mt-1 text-sm text-[var(--muted)]">{formatCurrency(item.priceCents)}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          className="input-field w-24"
                          type="number"
                          min={1}
                          max={Math.max(1, item.stock)}
                          value={item.quantity}
                          onChange={(event) => updateBagQuantity(item.productId, Number(event.target.value))}
                        />
                        <div className="min-w-28 text-right text-sm font-semibold text-[var(--text)]">
                          {formatCurrency(item.priceCents * item.quantity)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromBag(item.productId)}
                          className="rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
                        >
                          Устгах
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-[var(--text)]">Захиалгын дүн</div>
                <div className="text-2xl font-semibold text-[var(--text)]">{formatCurrency(totalAmountCents)}</div>
              </div>
              <div className="mt-3 text-sm text-[var(--muted)]">
                Нийт {bagItems.reduce((sum, item) => sum + item.quantity, 0)} ширхэг бараа захиалга руу орно.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="text-lg font-semibold text-[var(--text)]">Хүргэлтийн мэдээлэл</div>
              {auth && isCustomerRole(auth.user.role) ? (
                <div className="mt-4 grid gap-4">
                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                    <div className="text-lg font-semibold text-[var(--text)]">Хаяг нэмэх</div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Хаягийн нэр</label>
                      <div className="flex flex-wrap gap-2">
                        {addressLabels.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setAddressLabel(label)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                              addressLabel === label
                                ? "border-[rgba(207,35,45,0.55)] bg-[rgba(207,35,45,0.14)] text-[var(--text)]"
                                : "border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--muted)] hover:text-[var(--text)]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Хот</label>
                      <select
                        className="input-field"
                        value={city}
                        onChange={(event) => setCity(event.target.value as (typeof cityOptions)[number])}
                      >
                        {cityOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Дэлгэрэнгүй хаяг</label>
                      <textarea
                        className="input-field min-h-28"
                        maxLength={255}
                        value={detailedAddress}
                        onChange={(event) => setDetailedAddress(event.target.value)}
                        placeholder="Байр, орц, давхар, тоот болон хүргэлтэд хэрэгтэй тайлбараа дэлгэрэнгүй оруулна уу."
                      />
                      <div className="mt-2 text-right text-xs text-[var(--muted)]">{detailedAddress.length} / 255</div>
                    </div>

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        className="secondary-button"
                        disabled={locationStatus === "searching"}
                      >
                        {locationStatus === "searching" ? "Байршил уншиж байна..." : "Яг одоогийн байршлыг ашиглах"}
                      </button>
                      <div className="mt-3 text-sm text-[var(--muted)]">
                        {selectedLocation ? (
                          <>
                            {selectedLocation.source === "device" ? "Төхөөрөмжийн яг байршил хадгалагдсан." : "Хаягаас тооцоолсон байршил ашиглагдана."}
                            {" "}
                            ({selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)})
                          </>
                        ) : (
                          <>Яг хүргүүлэх цэгээ тэмдэглэх бол төхөөрөмжийн байршлаа ашиглана уу.</>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4">
                      <div className="text-base font-semibold text-[var(--text)]">Хүлээн авагчийн мэдээлэл</div>
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Нэр</label>
                          <input
                            className="input-field"
                            type="text"
                            value={recipientFirstName}
                            onChange={(event) => setRecipientFirstName(event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Овог</label>
                          <input
                            className="input-field"
                            type="text"
                            value={recipientLastName}
                            onChange={(event) => setRecipientLastName(event.target.value)}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Утас</label>
                          <input
                            className="input-field"
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={recipientPhone}
                            onChange={(event) => setRecipientPhone(normalizePhoneNumber(event.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted)]">
                    Захиалга үүсэхэд авах цэг автоматаар XADE агуулахаас тохируулагдана.
                  </div>
                  <PaymentSection amountCents={totalAmountCents} onChange={setPaymentDraft} />
                  {locationError ? (
                    <div className="rounded-2xl border border-[rgba(255,90,95,0.34)] bg-[rgba(255,90,95,0.12)] px-4 py-3 text-sm text-[var(--red)]">
                      {locationError}
                    </div>
                  ) : null}
                  {error ? <div className="text-sm text-[var(--red)]">{error}</div> : null}
                  <button
                    type="button"
                    onClick={() => orderMutation.mutate()}
                    disabled={!canCheckout}
                    className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {orderMutation.isPending || locationStatus === "searching" ? "Захиалга үүсгэж байна..." : "Төлбөрөө баталгаажуулаад захиалах"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <div>Олон бараатай захиалга хийхийн тулд хэрэглэгчийн эрхээр нэвтэрнэ үү.</div>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/login" className="primary-button">
                      Хэрэглэгчээр нэвтрэх
                    </Link>
                    <Link href="/signup" className="secondary-button">
                      Бүртгүүлэх
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-[2rem] p-5">
              <MapView
                title="Сагсны хүргэлтийн зураг"
                markers={[
                  {
                    id: "warehouse",
                    label: "XADE агуулах",
                    latitude: 47.9184,
                    longitude: 106.9177,
                    color: "#cf232d",
                  },
                  ...(selectedLocation
                    ? [
                        {
                          id: "customer-location",
                          label: selectedLocation.source === "device" ? "Таны яг байршил" : "Таны хүргэлтийн байршил",
                          latitude: selectedLocation.latitude,
                          longitude: selectedLocation.longitude,
                          color: "#2563eb",
                        },
                      ]
                    : []),
                ]}
                route={
                  selectedLocation
                    ? {
                        profile: "driving",
                        waypoints: [
                          {
                            id: "warehouse-route",
                            label: "XADE агуулах",
                            latitude: 47.9184,
                            longitude: 106.9177,
                          },
                          {
                            id: "customer-route",
                            label: selectedLocation.source === "device" ? "Таны яг байршил" : "Таны хүргэлтийн байршил",
                            latitude: selectedLocation.latitude,
                            longitude: selectedLocation.longitude,
                          },
                        ],
                        lineColor: "#2563eb",
                        summaryTitle: "Агуулахаас хүргэх маршрут",
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
