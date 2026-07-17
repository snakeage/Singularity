"use client";

import Image from "next/image";
import {
  getSkin,
  portraitSrc,
  type Presentation,
  type SkinArchetypeId,
} from "@/lib/characterSkins";

type Props = {
  presentation: Presentation;
  skinId: SkinArchetypeId | string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE = {
  sm: "h-9 w-9",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
} as const;

const PX = {
  sm: 36,
  md: 56,
  lg: 80,
  xl: 112,
} as const;

export function PortraitAvatar({
  presentation,
  skinId,
  size = "md",
  className = "",
}: Props) {
  const skin = getSkin(skinId);
  const src = portraitSrc(skin.id, presentation);

  return (
    <div
      className={`portrait-avatar relative shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--panel-2)] shadow-sm ${SIZE[size]} ${className}`}
      data-presentation={presentation}
      data-skin={skin.id}
      aria-hidden
    >
      <Image
        src={src}
        alt=""
        width={PX[size]}
        height={PX[size]}
        className="h-full w-full object-cover"
        sizes={`${PX[size]}px`}
      />
    </div>
  );
}
