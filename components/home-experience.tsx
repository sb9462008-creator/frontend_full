"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";

import { SiteLogo } from "@/components/site-logo";

export function HomeExperience() {
  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const introVisible = !ready || showIntro;

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem("home-intro-dismissed") === "1";
    setShowIntro(!dismissed);
    setReady(true);
  }, []);

  return (
    <>
      <div
        className={`intro-screen ${introVisible ? "intro-screen-visible" : "intro-screen-hidden"}`}
        aria-hidden={!introVisible}
      >
        <div className="intro-ambient intro-ambient-left" />
        <div className="intro-ambient intro-ambient-right" />
        <div className="intro-shell">
          <SiteLogo size="lg" animated subtitle="Performance Hardware" className="justify-center" />
          <p className="mt-8 max-w-xl text-center text-sm leading-8 text-[var(--muted)]">
            Clean gaming hardware storefront for parts, builds, tracking, and delivery operations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.setItem("home-intro-dismissed", "1");
                startTransition(() => setShowIntro(false));
              }}
              className="primary-button min-w-48"
            >
              Continue to site
            </button>
            <Link href="/courier/login" className="secondary-button min-w-48">
              Courier login
            </Link>
            <Link href="/login" className="secondary-button min-w-48">
              Customer login
            </Link>
          </div>
          <p className="mt-4 text-center text-xs tracking-[0.08em] text-[var(--muted)]">
            Courier tracking works from the courier login page.
          </p>
        </div>
      </div>

      <main
        className={`mx-auto max-w-7xl px-6 py-10 transition duration-700 ${introVisible ? "pointer-events-none translate-y-6 opacity-0 blur-sm" : "translate-y-0 opacity-100 blur-0"}`}
      >
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-panel rounded-[1rem] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">ӨНӨӨДРИЙН ЗАХИАЛГА</div>
            <div className="mt-3 text-4xl font-extrabold text-[#f5f5f3]">128</div>
            <div className="mt-2 text-sm text-[var(--green)]">Энэ долоо хоногт 12.4%-ийн өсөлт</div>
          </div>
          <div className="glass-panel rounded-[1rem] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">ИДЭВХТЭЙ КУРЬЕР</div>
            <div className="mt-3 text-4xl font-extrabold text-[#f5f5f3]">24</div>
            <div className="mt-2 text-sm text-[var(--blue)]">Одоогоор хүргэлт дээр ажиллаж байна</div>
          </div>
          <div className="glass-panel rounded-[1rem] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">ДУНДАЖ ХҮРЭХ ХУГАЦАА</div>
            <div className="mt-3 text-4xl font-extrabold text-[#f5f5f3]">18 мин</div>
            <div className="mt-2 text-sm text-[var(--yellow)]">Идэвхтэй хүргэлтүүдийн дундаж үзүүлэлт</div>
          </div>
          <div className="glass-panel rounded-[1rem] p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">АМЖИЛТТАЙ ХҮРГЭЛТ</div>
            <div className="mt-3 text-4xl font-extrabold text-[#f5f5f3]">96%</div>
            <div className="mt-2 text-sm text-[var(--accent-2)]">Цагтаа хүргэсэн захиалгын хувь</div>
          </div>
        </div>

        <div>
          <section className="glass-panel rounded-[1.25rem] p-8">
            <div className="eyebrow">XADE хүргэлтийн үйлчилгээ</div>
            <h1 className="mt-4 max-w-4xl text-5xl font-extrabold tracking-tight text-[#f5f5f3] md:text-6xl">
              Улаанбаатар хотод түргэн, найдвартай, хяналттай хүргэлтийн үйлчилгээг нэг дороос.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
              XADE нь хэрэглэгч, жолооч, админ гурвыг нэг системд холбосон орчин үеийн хүргэлтийн платформ юм. Захиалга үүсгэх, бараа хянах, жолоочийн байршил харах, хүргэлтийн явцыг бодит цаг дээр шалгах боломжийг цэгцтэй, ойлгомжтой байдлаар хүргэнэ.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/shop" className="primary-button">
                Дэлгүүр үзэх
              </Link>
              <Link href="/login" className="secondary-button">
                Нэвтрэх
              </Link>
              <Link href="/track" className="secondary-button">
                Захиалга хянах
              </Link>
            </div>

            <section className="mt-8 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-2)] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Courier</div>
                  <h2 className="mt-3 text-2xl font-bold text-[#f5f5f3]">Become Courier</h2>
                </div>
                <div className="h-3 w-3 rounded-full bg-[var(--green)]" />
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                XADE-ийн хүргэлтийн багт нэгдэж, курьерын эрх үүсгээд хүргэлт хүлээн авах, шууд байршил илгээх, хүргэлтийн явцаа систем дээрээс удирдах боломжтой.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/courier/signup" className="primary-button">
                  Курьер бүртгүүлэх
                </Link>
                <Link href="/courier/login" className="secondary-button">
                  Курьераар нэвтрэх
                </Link>
              </div>
            </section>
          </section>
        </div>
      </main>
    </>
  );
}
