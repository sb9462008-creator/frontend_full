import { useEffect, useState, useSyncExternalStore } from "react";

export type BagItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl?: string | null;
  category: string;
  brand?: string | null;
  quantity: number;
  stock: number;
};

const STORAGE_KEY = "xade_bag";
const CHANGE_EVENT = "xade-bag-changed";
const EMPTY_BAG: BagItem[] = [];
let cachedBag: BagItem[] = EMPTY_BAG;
let cachedRawBag: string | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function emitChange() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function sanitize(items: BagItem[]) {
  return items
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Math.min(item.quantity, Math.max(1, item.stock))),
    }))
    .filter((item) => item.stock > 0);
}

export function readBag() {
  if (!isBrowser()) {
    return EMPTY_BAG;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRawBag) {
      return cachedBag;
    }

    if (!raw) {
      cachedRawBag = null;
      cachedBag = EMPTY_BAG;
      return cachedBag;
    }

    const parsed = JSON.parse(raw) as BagItem[];
    cachedRawBag = raw;
    cachedBag = sanitize(Array.isArray(parsed) ? parsed : []);
    return cachedBag;
  } catch {
    cachedRawBag = null;
    cachedBag = EMPTY_BAG;
    return cachedBag;
  }
}

export function writeBag(items: BagItem[]) {
  if (!isBrowser()) {
    return;
  }

  cachedBag = sanitize(items);
  if (cachedBag.length === 0) {
    cachedRawBag = null;
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    cachedRawBag = JSON.stringify(cachedBag);
    window.localStorage.setItem(STORAGE_KEY, cachedRawBag);
  }
  emitChange();
}

export function addToBag(item: Omit<BagItem, "quantity">, quantity = 1) {
  const current = readBag();
  const existing = current.find((entry) => entry.productId === item.productId);

  if (existing) {
    writeBag(
      current.map((entry) =>
        entry.productId === item.productId
          ? {
              ...entry,
              quantity: Math.min(entry.quantity + quantity, Math.max(1, item.stock)),
              stock: item.stock,
              priceCents: item.priceCents,
              imageUrl: item.imageUrl,
              brand: item.brand,
              category: item.category,
              name: item.name,
              slug: item.slug,
            }
          : entry,
      ),
    );
    return;
  }

  writeBag([
    ...current,
    {
      ...item,
      quantity: Math.min(quantity, Math.max(1, item.stock)),
    },
  ]);
}

export function updateBagQuantity(productId: string, quantity: number) {
  const current = readBag();
  writeBag(
    current.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: Math.max(1, Math.min(quantity, Math.max(1, item.stock))),
          }
        : item,
    ),
  );
}

export function removeFromBag(productId: string) {
  writeBag(readBag().filter((item) => item.productId !== productId));
}

export function clearBag() {
  writeBag([]);
}

function subscribe(callback: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useBagItems() {
  const [hydrated, setHydrated] = useState(false);
  const items = useSyncExternalStore(subscribe, readBag, () => EMPTY_BAG);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? items : EMPTY_BAG;
}

export function useBagCount() {
  const items = useBagItems();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
