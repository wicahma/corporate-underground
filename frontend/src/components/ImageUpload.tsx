"use client";

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

export interface UploadedImage {
  id: string;
  url: string;
  key: string;
  width?: number;
  height?: number;
}

export interface ImageUploadHandle {
  uploadPendingImages: () => Promise<UploadedImage[]>;
  hasPending: () => boolean;
}

interface ImageUploadProps {
  onUploadComplete?: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export const ImageUpload = forwardRef<ImageUploadHandle, ImageUploadProps>(
  function ImageUpload(
    { onUploadComplete, maxImages = 10, maxSizeMB = 5 },
    ref,
  ) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(newFiles);

      // Validate count
      if (files.length + fileArray.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Validate size
      const oversized = fileArray.filter((f) => f.size > maxSizeBytes);
      if (oversized.length > 0) {
        setError(`Each image must be under ${maxSizeMB}MB`);
        return;
      }

      // Validate type
      const invalid = fileArray.filter((f) => !f.type.startsWith("image/"));
      if (invalid.length > 0) {
        setError("Only image files allowed");
        return;
      }

      const updatedFiles = [...files, ...fileArray];
      setFiles(updatedFiles);

      // Generate previews
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    },
    [files, maxImages, maxSizeBytes, maxSizeMB]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  useImperativeHandle(ref, () => ({
    uploadPendingImages: async () => {
      if (files.length === 0) return [];
      return uploadImages();
    },
    hasPending: () => files.length > 0,
  }));

  const uploadImages = async (): Promise<UploadedImage[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const uploadPromise = new Promise<UploadedImage[]>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
      });

      xhr.open("POST", `${API_BASE}/uploads/images`);
      xhr.withCredentials = true;
      xhr.send(formData);

      const result = await uploadPromise;
      onUploadComplete?.(result);

      // Clear after successful upload
      setFiles([]);
      setPreviews([]);
      setProgress(0);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card p-6 text-center cursor-pointer transition-colors ${
          isDragging ? "border-fg bg-panel2" : "hover:border-fg/50"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-dim" />
        <p className="text-xs text-dim">
          Drag & drop images here or click to browse
        </p>
        <p className="text-[10px] text-dim mt-1">
          Max {maxImages} images, {maxSizeMB}MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-danger border border-danger/40 bg-danger/10 p-2">
          {error}
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover border border-line"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-1 right-1 bg-ink/80 hover:bg-ink text-fg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => uploadImages()}
            disabled={uploading}
            className="btn btn-primary w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              <>Upload {files.length} image{files.length !== 1 ? "s" : ""}</>
            )}
          </button>

          {uploading && (
            <div className="w-full bg-panel2 h-2 overflow-hidden">
              <div
                className="bg-fg h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
