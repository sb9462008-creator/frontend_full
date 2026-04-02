"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

import { formatCurrency } from "@/lib/format";

export type PaymentDraft = {
  method: "CARD" | "QR";
  isComplete: boolean;
  summary: string;
};

function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 19);
}

function formatCardNumber(value: string) {
  return normalizeCardNumber(value).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function normalizeExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length < 3) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidExpiry(value: string) {
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return false;
  }

  const [monthText, yearText] = value.split("/");
  const month = Number(monthText);
  const year = Number(yearText);

  return month >= 1 && month <= 12 && year >= 0;
}

export function PaymentSection({
  amountCents,
  onChange,
}: {
  amountCents: number;
  onChange: (draft: PaymentDraft) => void;
}) {
  const [method, setMethod] = useState<PaymentDraft["method"]>("CARD");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [qrConfirmed, setQrConfirmed] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");

  const qrReference = useMemo(() => `XADE-${amountCents}`, [amountCents]);
  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        scheme: "MEQR",
        merchant: "XADE COMPUTER STORE",
        accountName: "XADE LLC",
        bank: "XACBANK",
        amount: Number((amountCents / 100).toFixed(2)),
        currency: "USD",
        reference: qrReference,
        city: "Ulaanbaatar",
      }),
    [amountCents, qrReference],
  );

  const cardDigits = normalizeCardNumber(cardNumber);
  const trimmedCardholderName = cardholderName.trim();
  const trimmedCvv = cvv.trim();
  const cardIsComplete =
    trimmedCardholderName.length >= 2 &&
    cardDigits.length >= 13 &&
    isValidExpiry(expiry) &&
    /^\d{3,4}$/.test(trimmedCvv);

  const paymentDraft = useMemo<PaymentDraft>(() => {
    if (method === "CARD") {
      return {
        method,
        isComplete: cardIsComplete,
        summary: cardIsComplete
          ? `Төлбөр: Visa/Mastercard, картын төгсгөл ${cardDigits.slice(-4)}`
          : "Төлбөр: Картаар төлөхөөр сонгосон",
      };
    }

    return {
      method,
      isComplete: qrConfirmed,
      summary: qrConfirmed
        ? `Төлбөр: QR, лавлах код ${qrReference}`
        : `Төлбөр: QR сонгосон, лавлах код ${qrReference}`,
    };
  }, [cardDigits, cardIsComplete, method, qrConfirmed, qrReference]);

  useEffect(() => {
    onChange(paymentDraft);
  }, [onChange, paymentDraft]);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 220,
      color: {
        dark: "#111111",
        light: "#f7f4ef",
      },
    })
      .then((url) => {
        if (!cancelled) {
          setQrImageUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrImageUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-[var(--text)]">Төлбөрийн хэсэг</div>
          <div className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Карт эсвэл QR төлбөрийн аргаа сонгоно уу. Аюулгүй байдлын үүднээс бүтэн картын мэдээлэл сервер дээр хадгалагдахгүй.
          </div>
        </div>
        <div className="rounded-full border border-[rgba(207,35,45,0.24)] bg-[rgba(207,35,45,0.12)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
          Төлөх дүн: {formatCurrency(amountCents)}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMethod("CARD")}
          className={method === "CARD" ? "primary-button" : "secondary-button"}
        >
          Visa / Mastercard
        </button>
        <button
          type="button"
          onClick={() => setMethod("QR")}
          className={method === "QR" ? "primary-button" : "secondary-button"}
        >
          QR төлбөр
        </button>
      </div>

      {method === "CARD" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(135deg,rgba(207,35,45,0.18),rgba(15,15,15,0.92))] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.7)]">
                  XADE Secure Checkout
                </div>
                <div className="mt-4 text-2xl font-semibold text-white">
                  {formatCardNumber(cardNumber) || "0000 0000 0000 0000"}
                </div>
                <div className="mt-4 flex flex-wrap gap-8 text-sm text-[rgba(255,255,255,0.76)]">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">Cardholder</div>
                    <div className="mt-1">{trimmedCardholderName || "YOUR NAME"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.55)]">Expires</div>
                    <div className="mt-1">{expiry || "MM/YY"}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                Visa
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Карт эзэмшигчийн нэр</label>
            <input
              className="input-field"
              type="text"
              placeholder="BATBOLD B"
              value={cardholderName}
              onChange={(event) => setCardholderName(event.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Картын дугаар</label>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              placeholder="4111 1111 1111 1111"
              value={formatCardNumber(cardNumber)}
              onChange={(event) => setCardNumber(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">Дуусах хугацаа</label>
            <input
              className="input-field"
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={expiry}
              onChange={(event) => setExpiry(normalizeExpiry(event.target.value))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text)]">CVV</label>
            <input
              className="input-field"
              type="password"
              inputMode="numeric"
              placeholder="123"
              value={cvv}
              onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
          <div className="rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-4">
            {qrImageUrl ? (
              <Image
                src={qrImageUrl}
                alt="MEQR style payment QR"
                width={220}
                height={220}
                className="h-auto w-full rounded-[1rem] bg-[#f7f4ef] p-3"
                unoptimized
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[1rem] bg-[#f7f4ef] text-sm text-slate-500">
                QR үүсгэж байна...
              </div>
            )}
          </div>

          <div className="rounded-[1.35rem] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">MEQR style</div>
            <div className="mt-3 grid gap-3 text-sm text-[var(--muted)]">
              <div>
                <span className="font-semibold text-[var(--text)]">Хүлээн авагч:</span> XADE LLC
              </div>
              <div>
                <span className="font-semibold text-[var(--text)]">Банк:</span> XacBank
              </div>
              <div>
                <span className="font-semibold text-[var(--text)]">Дүн:</span> {formatCurrency(amountCents)}
              </div>
              <div>
                <span className="font-semibold text-[var(--text)]">Лавлах код:</span> {qrReference}
              </div>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-[1rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[var(--muted)]">
              <input
                type="checkbox"
                checked={qrConfirmed}
                onChange={(event) => setQrConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>QR уншуулж төлбөрөө хийсэн. Захиалгыг энэ лавлах кодоор бүртгэж болно.</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
