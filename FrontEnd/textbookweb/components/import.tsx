"use client";

import { useRef } from "react";


type Props = {
  onPreview?: (src: string) => void; // returns a data URL for the left preview
};

export default function ImportButton({ onPreview }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    fileRef.current?.click();
  }

  // When a file is chosen, read it as a data URL and pass to page
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPreview?.(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={openPicker}
        className="cursor-pointer rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 hover:bg-white/10"
      >
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.csv,.xlsx,.xls"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
