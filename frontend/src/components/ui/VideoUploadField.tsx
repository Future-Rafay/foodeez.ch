"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatFileSize,
  MAX_VIDEO_UPLOAD_SIZE_BYTES,
  resolveMediaUrl,
} from "@/lib/media";
import { cn } from "@/lib/utils";

interface VideoUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onFileSelect: (file: File | null) => void;
  videoFile: File | null;
  disabled?: boolean;
  uploading?: boolean;
  className?: string;
}

export default function VideoUploadField({
  label = "Video",
  value,
  onChange,
  onFileSelect,
  videoFile,
  disabled = false,
  uploading = false,
  className,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!videoFile) {
      setLocalPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(videoFile);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [videoFile]);

  const displaySrc = localPreviewUrl || resolveMediaUrl(value) || null;

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file || !file.type.startsWith("video/")) return;
      onFileSelect(file);
    },
    [onFileSelect]
  );

  function clearSelection() {
    onFileSelect(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>

      <div
        role="button"
        tabIndex={disabled || uploading ? -1 : 0}
        aria-disabled={disabled || uploading}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !uploading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (disabled || uploading) return;
          handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() =>
          !disabled && !uploading && !displaySrc && inputRef.current?.click()
        }
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed transition-colors",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50",
          (disabled || uploading) && "cursor-not-allowed opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(event) =>
            handleFile(event.target.files?.[0] ?? null)
          }
        />

        {displaySrc ? (
          <div className="grid min-w-0 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <video
              src={displaySrc}
              controls
              preload="metadata"
              className="h-28 w-full rounded-lg bg-black object-contain"
              onClick={(event) => event.stopPropagation()}
            />
            <div className="min-w-0 space-y-2">
              <p className="max-w-full truncate text-xs text-gray-500">
                {videoFile
                  ? `${videoFile.name} · ${formatFileSize(videoFile.size)}`
                  : "Saved video"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-primary bg-primary px-2 text-xs text-white hover:bg-primary/90 hover:text-white"
                  disabled={disabled || uploading}
                  onClick={(event) => {
                    event.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 border border-red-200 bg-red-50 px-2 text-xs text-red-600 hover:bg-red-100 hover:text-red-700"
                  disabled={disabled || uploading}
                  onClick={(event) => {
                    event.stopPropagation();
                    clearSelection();
                  }}
                >
                  <X className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-3 py-5 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Film className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium leading-5 text-gray-700">
              Drop a video here or click to browse
            </p>
            <p className="mt-1 break-words text-xs leading-4 text-gray-500">
              MP4, MOV, WebM · max {formatFileSize(MAX_VIDEO_UPLOAD_SIZE_BYTES)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
