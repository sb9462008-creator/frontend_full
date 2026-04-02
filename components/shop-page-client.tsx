"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";

import { AddToBagButton } from "@/components/add-to-bag-button";
import { SectionShell } from "@/components/section-shell";
import { useStoredAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { translateProductCategory } from "@/lib/product-copy";
import type { Product } from "@/lib/types";

const shopSections = [
  {
    id: "pc-parts",
    title: "PC эд анги",
    description: "Процессор, видео карт, санах ой, эх хавтан, SSD, тэжээлийн блок, хөргөлт, кейс зэрэг үндсэн эд ангиуд.",
    categories: ["CPU", "GPU", "RAM", "MOTHERBOARD", "SSD", "POWER_SUPPLY", "COOLER", "CASE"],
  },
  {
    id: "monitors",
    title: "Дэлгэц",
    description: "ZOWIE, ASUS болон бусад өндөр сэргэлтийн gaming дэлгэцүүд.",
    categories: ["MONITOR"],
  },
  {
    id: "pc-builds",
    title: "Бэлэн PC build",
    description: "Gaming, стрийм, бүтээлч ажилд зориулагдсан бэлэн угсарсан компьютерүүд.",
    categories: ["PC_BUILD"],
  },
  {
    id: "accessories",
    title: "Дагалдах хэрэгсэл",
    description: "Gaming хулгана, гар, хулганы дэвсгэр зэрэг дагалдах хэрэгслүүд.",
    categories: ["MOUSE", "KEYBOARD", "MOUSEPAD"],
  },
] as const;

function matchesProduct(product: Product, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    product.name,
    product.brand ?? "",
    product.category,
    product.slug,
    product.sku,
    product.description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="glass-panel rounded-[1.4rem] p-5 transition-transform hover:-translate-y-1 hover:border-[rgba(207,35,45,0.55)]">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-[var(--surface-2)]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">Зураг алга</div>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              {translateProductCategory(product.category)}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text)]">{product.name}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {product.description ?? "Орчин үеийн тоглоом болон бүтээлч ажлын системд тохирсон."}
            </p>
          </div>
          <div className="text-right">
            <div suppressHydrationWarning className="text-lg font-semibold text-[var(--text)]">
              {formatCurrency(product.priceCents)}
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">{product.stock} ширхэг үлдсэн</div>
          </div>
        </div>
      </Link>
      <div className="mt-4 flex flex-wrap gap-3">
        <AddToBagButton product={product} />
        <Link href={`/shop/${product.slug}`} className="secondary-button">
          Дэлгэрэнгүй
        </Link>
      </div>
    </div>
  );
}

export function ShopPageClient({
  initialQuery,
  initialProducts,
}: {
  initialQuery: string;
  initialProducts: Product[];
}) {
  const { auth } = useStoredAuth();
  const deferredSearchQuery = useDeferredValue(initialQuery);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const products = initialProducts;
  const filteredProducts = products.filter((product) => matchesProduct(product, deferredSearchQuery));
  const sections = shopSections
    .map((section) => ({
      ...section,
      products: filteredProducts.filter((product) => (section.categories as readonly string[]).includes(product.category)),
    }))
    .filter((section) => section.products.length > 0);
  const uncategorizedProducts = filteredProducts.filter(
    (product) => !shopSections.some((section) => (section.categories as readonly string[]).includes(product.category)),
  );
  const hasActiveSearch = deferredSearchQuery.trim().length > 0;
  const prioritizedSections = activeSectionId
    ? [
        ...sections.filter((section) => section.id === activeSectionId),
        ...sections.filter((section) => section.id !== activeSectionId),
      ]
    : sections;

  useEffect(() => {
    if (activeSectionId && !sections.some((section) => section.id === activeSectionId)) {
      setActiveSectionId(null);
    }
  }, [activeSectionId, sections]);

  return (
    <SectionShell
      eyebrow="Дэлгүүр"
      title="Компьютерийн сэлбэг"
      description="PC эд анги, дэлгэц, бэлэн компьютер болон gaming дагалдах хэрэгслүүдээ ангиллаар нь сонгож, захиалаад, хүргэлтийн явцаа хянаарай."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link href="/bag" className="secondary-button">
            Миний сагс
          </Link>
          {auth?.user.role === "CUSTOMER" ? (
            <Link href="/orders" className="primary-button">
              Миний захиалгууд
            </Link>
          ) : (
            <>
              <Link href="/login" className="primary-button">
                Хэрэглэгчээр нэвтрэх
              </Link>
              <Link href="/signup" className="secondary-button">
                Бүртгүүлэх
              </Link>
            </>
          )}
        </div>
      }
    >
      <div className="mb-6 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Одоогоор {products.length} бүтээгдэхүүн харагдаж байна
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {sections.length > 1 ? (
          <button
            type="button"
            onClick={() => setActiveSectionId(null)}
            className={activeSectionId === null ? "primary-button" : "secondary-button"}
          >
            Бүх ангилал
          </button>
        ) : null}
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSectionId((current) => (current === section.id ? null : section.id))}
            className={activeSectionId === section.id ? "primary-button" : "secondary-button"}
          >
            {section.title}
          </button>
        ))}
      </div>

      {sections.length === 0 && !hasActiveSearch ? (
        products.length > 0 ? (
          <section className="mb-10 space-y-5">
            <div className="glass-panel rounded-[1.5rem] p-6">
              <div className="eyebrow">Бүх бараа</div>
              <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">Бүх бүтээгдэхүүн</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Ангиллын хэсгүүд ачаалагдаагүй тул бүх барааг нэг дор харуулж байна.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={`fallback-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <div className="mb-8 glass-panel rounded-[1.5rem] p-6 text-sm leading-7 text-[var(--muted)]">
            Одоогоор харуулах бүтээгдэхүүн алга.
          </div>
        )
      ) : null}

      {hasActiveSearch ? (
        <section className="mb-10 space-y-5">
          <div className="glass-panel rounded-[1.5rem] p-6">
            <div className="eyebrow">Хайлтын үр дүн</div>
            <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">
              "{deferredSearchQuery}" хайлтын үр дүн
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Нэр, ангилал, брэнд, SKU болон тайлбар дотор давхцсан бүх бүтээгдэхүүнийг харуулж байна.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {filteredProducts.length} бүтээгдэхүүн
              </div>
              <Link href="/shop" className="secondary-button">
                Бүх бараа руу буцах
              </Link>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={`search-${product.id}`} product={product} />
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-[1.5rem] p-6 text-sm leading-7 text-[var(--muted)]">
              Тохирох бүтээгдэхүүн олдсонгүй. Өөр үсэг, брэнд, эсвэл ангиллын нэрээр хайгаад үзээрэй.
            </div>
          )}
        </section>
      ) : null}

      <div className="space-y-10">
        {prioritizedSections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-5 scroll-mt-28">
            <div className="glass-panel rounded-[1.5rem] p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="eyebrow">{section.title}</div>
                  <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">{section.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{section.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {section.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
                    >
                      {translateProductCategory(category)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}

        {uncategorizedProducts.length > 0 ? (
          <section id="more-products" className="space-y-5 scroll-mt-28">
            <div className="glass-panel rounded-[1.5rem] p-6">
              <div className="eyebrow">Нэмэлт бараа</div>
              <h2 className="mt-3 text-3xl font-bold text-[var(--text)]">Бусад бүтээгдэхүүн</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                Үндсэн ангилалд хамаараагүй ч захиалах боломжтой бараанууд.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {uncategorizedProducts.map((product) => (
                <ProductCard key={`uncategorized-${product.id}`} product={product} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SectionShell>
  );
}
