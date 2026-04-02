"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SiteLogo } from "@/components/site-logo";
import { canAccessDriverPortal, clearAuth, isAdminRole, isCustomerRole, useStoredAuth } from "@/lib/auth";
import { useBagCount } from "@/lib/bag";

function HeaderSearch() {
  return (
    <form action="/shop" className="flex min-w-[220px] items-center gap-2">
      <input
        className="input-field h-10 min-w-0 flex-1 px-3 py-2 text-sm"
        type="search"
        name="q"
        placeholder="Search products"
      />
      <button type="submit" className="primary-button px-4 py-2 text-sm">
        Search
      </button>
    </form>
  );
}

export function AppHeader() {
  const router = useRouter();
  const { auth } = useStoredAuth();
  const bagCount = useBagCount();

  return (
    <header className="border-b border-[rgba(61,61,61,0.92)] bg-[rgba(18,18,18,0.96)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <SiteLogo animated />
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--muted)]">
          {auth ? (
            <>
              {isCustomerRole(auth.user.role) ? (
                <>
                  <HeaderSearch />
                  <Link href="/bag" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Сагс {bagCount > 0 ? `(${bagCount})` : ""}
                  </Link>
                  <Link href="/shop" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Дэлгүүр
                  </Link>
                  <Link href="/orders" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Захиалгууд
                  </Link>
                </>
              ) : null}
              {isAdminRole(auth.user.role) ? (
                <>
                  <Link href="/admin/dashboard" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Самбар
                  </Link>
                  <Link href="/admin/deliveries" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Хүргэлтүүд
                  </Link>
                  <Link href="/admin/drivers" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Курьерууд
                  </Link>
                  <Link href="/admin/reports" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                    Тайлан
                  </Link>
                </>
              ) : null}
              {canAccessDriverPortal(auth.user.role) ? (
                <Link href="/driver/deliveries" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                  Курьер
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  clearAuth();
                  router.push("/shop");
                }}
                className="cursor-pointer rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
              >
                Гарах
              </button>
            </>
          ) : (
            <>
              <HeaderSearch />
              <Link href="/bag" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                Сагс {bagCount > 0 ? `(${bagCount})` : ""}
              </Link>
              <Link href="/shop" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                Дэлгүүр
              </Link>
              <Link href="/login" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                Нэвтрэх
              </Link>
              <Link href="/signup" className="rounded-xl px-3 py-2 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-white">
                Бүртгүүлэх
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
