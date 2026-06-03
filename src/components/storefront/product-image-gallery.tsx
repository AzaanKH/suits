"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

type ProductImageGalleryProps = {
  images: ProductImage[];
};

const fallbackGalleryImage = {
  src: "/images/hero-tailoring.png",
  alt: "Tailored suit placeholder",
};

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(
    images[0] ?? null,
  );
  const displayImage = selectedImage ?? images[0] ?? fallbackGalleryImage;

  return (
    <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
      <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
        {images.map((image) => (
          <button
            type="button"
            className={cn(
              "bg-stone relative aspect-[2/3] w-16 overflow-hidden border sm:w-20",
              image.src === displayImage.src
                ? "border-ink"
                : "border-transparent",
            )}
            aria-label={`Show ${image.alt}`}
            aria-pressed={image.src === displayImage.src}
            key={`${image.src}-${image.alt}`}
            onClick={() => setSelectedImage(image)}
          >
            <Image
              fill
              sizes="80px"
              src={image.src}
              alt=""
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <div className="bg-stone relative order-1 aspect-[2/3] overflow-hidden sm:order-2">
        <Image
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={displayImage.src}
          alt={displayImage.alt}
          className="object-cover"
        />
      </div>
    </div>
  );
}
