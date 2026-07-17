"use client";

import Image from "next/image";
import type { MomentKind } from "@/lib/practiceMoments";
import { MOMENT_IMAGE } from "@/lib/practiceMoments";
import { Button } from "./ui";

export type MomentChoice = {
  id: string;
  label: string;
  variant?: "primary" | "ghost";
};

export function PracticeMomentDialog({
  kind,
  speaker,
  body,
  choices,
  onChoose,
}: {
  kind: MomentKind;
  speaker: string;
  body: string;
  choices: MomentChoice[];
  onChoose: (id: string) => void;
}) {
  const heading = kind === "norma" ? "Норма закрыта" : "Сильный заход";

  return (
    <div
      className="moment-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moment-dialog-title"
    >
      <div className="moment-dialog">
        <div className="moment-dialog__art">
          <Image
            src={MOMENT_IMAGE[kind]}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 28rem) 100vw, 28rem"
            priority
          />
          <div className="moment-dialog__art-fade" />
        </div>
        <div className="moment-dialog__body">
          <p className="moment-dialog__speaker">{speaker}</p>
          <h2 id="moment-dialog-title" className="moment-dialog__title">
            {heading}
          </h2>
          <p className="moment-dialog__text">{body}</p>
          <div className="moment-dialog__choices">
            {choices.map((choice) => (
              <Button
                key={choice.id}
                type="button"
                variant={choice.variant ?? "ghost"}
                className="w-full justify-start text-left"
                onClick={() => onChoose(choice.id)}
              >
                {choice.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
