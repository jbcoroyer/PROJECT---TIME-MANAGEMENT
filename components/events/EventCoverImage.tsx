"use client";

import { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { uploadOrgAsset } from "../../app/actions/storage";
import { updateEventCoverImage } from "../../app/actions/events";
import { useEventCoverUrl } from "../../lib/useEventCoverUrl";
import type { StorageBucket } from "../../lib/storagePaths";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../../lib/toast";
import { useTranslation } from "../../lib/i18n/useTranslation";

const EVENT_DOCUMENTS_BUCKET = "event-documents" as StorageBucket;

type EventCoverImageProps = {
  eventId: string;
  eventName: string;
  coverImagePath: string | null;
  variant?: "card" | "banner";
  editable?: boolean;
  onUpdated?: (path: string | null) => void;
};

export default function EventCoverImage({
  eventId,
  eventName,
  coverImagePath,
  variant = "card",
  editable = false,
  onUpdated,
}: EventCoverImageProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { url, loading } = useEventCoverUrl(coverImagePath);
  const [uploading, setUploading] = useState(false);

  const shellClass =
    variant === "banner"
      ? "relative h-44 w-full overflow-hidden rounded-t-[24px] bg-[var(--surface-soft)] sm:h-52"
      : "relative h-36 w-full overflow-hidden rounded-t-[22px] bg-[var(--surface-soft)]";

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toastError(t("eventsLegacy.cover.imageRequired"));
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
      const relativePath = `${eventId}/cover/${Date.now()}.${safeExt}`;
      const formData = new FormData();
      formData.set("file", file);

      const upload = await uploadOrgAsset(formData, EVENT_DOCUMENTS_BUCKET, relativePath);
      if (!upload.ok) {
        toastError(upload.error);
        return;
      }

      const previousPath = coverImagePath;
      const save = await updateEventCoverImage(eventId, upload.path);
      if (!save.ok) {
        toastError(save.error);
        return;
      }

      if (previousPath && previousPath !== upload.path) {
        const supabase = getSupabaseBrowser();
        await supabase.storage.from(EVENT_DOCUMENTS_BUCKET).remove([previousPath]);
      }

      toastSuccess(t("eventsLegacy.cover.toast.saved"));
      onUpdated?.(upload.path);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!coverImagePath) return;
    setUploading(true);
    try {
      const save = await updateEventCoverImage(eventId, null);
      if (!save.ok) {
        toastError(save.error);
        return;
      }
      const supabase = getSupabaseBrowser();
      await supabase.storage.from(EVENT_DOCUMENTS_BUCKET).remove([coverImagePath]);
      toastSuccess(t("eventsLegacy.cover.toast.removed"));
      onUpdated?.(null);
    } finally {
      setUploading(false);
    }
  };

  const showImage = Boolean(coverImagePath && url);

  return (
    <div className={shellClass}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url!}
          alt={t("eventsLegacy.cover.alt", { name: eventName })}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-[color:var(--foreground)]/45">
          {loading || uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-7 w-7 opacity-60" />
              {editable ? (
                <p className="text-xs font-medium">{t("eventsLegacy.cover.addCover")}</p>
              ) : null}
            </>
          )}
        </div>
      )}

      {editable ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.currentTarget.value = "";
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="ui-transition inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/95 px-3 text-xs font-semibold text-[var(--foreground)] shadow-sm hover:bg-white"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {coverImagePath ? t("eventsLegacy.cover.change") : t("eventsLegacy.cover.add")}
            </button>
            {coverImagePath ? (
              <button
                type="button"
                disabled={uploading}
                onClick={() => void handleRemove()}
                className="ui-transition inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/40 bg-black/30 px-3 text-xs font-semibold text-white hover:bg-black/45"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("eventsLegacy.cover.remove")}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
