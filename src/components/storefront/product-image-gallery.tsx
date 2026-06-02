"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";

type ProductImageGalleryProps = {
  images: ProductImage[];
};

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
      <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
        {images.map((image) => (
          <button
            type="button"
            className={cn(
              "bg-stone relative aspect-[2/3] w-16 overflow-hidden border sm:w-20",
              image.src === selectedImage.src
                ? "border-ink"
                : "border-transparent",
            )}
            aria-label={`Show ${image.alt}`}
            aria-pressed={image.src === selectedImage.src}
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
          src={selectedImage.src}
          alt={selectedImage.alt}
          className="object-cover"
        />
      </div>
    </div>
  );
}
