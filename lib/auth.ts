"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import type { AuthResponse, UserRole } from "./types";

const STORAGE_KEY = "hurgelt_auth";
const ADMIN_LOGIN_ROUTE = "/ops/login";
const DRIVER_LOGIN_ROUTE = "/courier/login";
let cachedRaw: string | null = null;
let cachedParsed: AuthResponse | null = null;

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "COMPANY_ADMIN", "DISPATCHER"];

export function persistAuth(payload: AuthResponse) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("hurgelt-auth-changed"));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("hurgelt-auth-changed"));
}

export function readAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === cachedRaw) {
    return cachedParsed;
  }

  cachedRaw = raw;
  cachedParsed = raw ? (JSON.parse(raw) as AuthResponse) : null;

  return cachedParsed;
}

export function useStoredAuth() {
  const [hydrated, setHydrated] = useState(false);
  const authSnapshot = useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      window.addEventListener("hurgelt-auth-changed", callback);

      return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener("hurgelt-auth-changed", callback);
      };
    },
    () => readAuth(),
    () => null,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const auth = hydrated ? authSnapshot : null;

  return {
    auth,
    ready: hydrated,
    save: (payload: AuthResponse) => {
      persistAuth(payload);
    },
    clear: () => {
      clearAuth();
    },
  };
}

export function isAdminRole(role: UserRole) {
  return ADMIN_ROLES.includes(role);
}

export function canAccessDriverPortal(role: UserRole) {
  return role === "DRIVER" || isAdminRole(role);
}

export function isCustomerRole(role: UserRole) {
  return role === "CUSTOMER";
}

export function getDefaultRouteForRole(role: UserRole) {
  if (isAdminRole(role)) {
    return "/admin/dashboard";
  }

  if (role === "DRIVER") {
    return "/driver/deliveries";
  }

  return "/shop";
}

export function useProtectedRoute(portal: "admin" | "driver" | "customer") {
  const router = useRouter();
  const authState = useStoredAuth();
  const { auth, ready } = authState;
  const loginRoute =
    portal === "admin" ? ADMIN_LOGIN_ROUTE : portal === "driver" ? DRIVER_LOGIN_ROUTE : "/login";
  const isAuthorized = auth
    ? portal === "admin"
      ? isAdminRole(auth.user.role)
      : portal === "driver"
        ? canAccessDriverPortal(auth.user.role)
        : isCustomerRole(auth.user.role)
    : false;

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!auth) {
      router.replace(loginRoute);
      return;
    }

    if (!isAuthorized) {
      router.replace(getDefaultRouteForRole(auth.user.role));
    }
  }, [auth, isAuthorized, loginRoute, ready, router]);

  return {
    ...authState,
    isAuthorized,
  };
}
