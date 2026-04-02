"use client";

import { useState } from "react";

import { addToBag } from "@/lib/bag";
import type { Product } from "@/lib/types";

export function AddToBagButton({
  product,
  quantity = 1,
  className = "secondary-button",
}: {
  product: Product;
  quantity?: number;
  className?: string;
}) {
  const [justAdded, setJustAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={product.stock < 1}
      onClick={() => {
        addToBag(
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
            category: product.category,
            brand: product.brand,
            stock: product.stock,
          },
          quantity,
        );

        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1500);
      }}
      className={`${className} ${product.stock < 1 ? "cursor-not-allowed opacity-60" : ""}`.trim()}
    >
      {product.stock < 1 ? "Дууссан" : justAdded ? "Сагсанд нэмэгдлээ" : "Сагсанд нэмэх"}
    </button>
  );
}
