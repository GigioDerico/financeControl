"use client"

import React, { useState, useRef } from "react"
import { Camera, ImagePlus, X, Loader2 } from "lucide-react"
import { isNative } from "@/lib/native"
import { takePhoto, pickFromGallery } from "@/lib/native/camera"
import { impactLight } from "@/lib/native/haptics"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ComprovanteCaptureProps {
    value: string | null
    onChange: (url: string | null) => void
    transacaoId?: string
    className?: string
}

export function ComprovanteCapture({
    value,
    onChange,
    transacaoId,
    className,
}: ComprovanteCaptureProps) {
    const [uploading, setUploading] = useState(false)
    const [preview, setPreview] = useState<string | null>(value)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function uploadDataUrl(dataUrl: string) {
        setUploading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            // Convert data URL to blob
            const response = await fetch(dataUrl)
            const blob = await response.blob()

            const ext = blob.type.includes("png") ? "png" : "jpg"
            const fileName = `${user.id}/${transacaoId ?? Date.now()}.${ext}`

            const { error } = await supabase.storage
                .from("comprovantes")
                .upload(fileName, blob, {
                    cacheControl: "3600",
                    upsert: true,
                    contentType: blob.type,
                })

            if (error) throw error

            const { data: urlData } = supabase.storage
                .from("comprovantes")
                .getPublicUrl(fileName)

            setPreview(urlData.publicUrl)
            onChange(urlData.publicUrl)
            await impactLight()
        } catch (error) {
            console.error("[Camera] Upload failed:", error)
        } finally {
            setUploading(false)
        }
    }

    async function handleCamera() {
        if (isNative()) {
            const photo = await takePhoto()
            if (photo) await uploadDataUrl(photo.dataUrl)
        } else {
            // Web: trigger file input with capture
            if (fileInputRef.current) {
                fileInputRef.current.setAttribute("capture", "environment")
                fileInputRef.current.click()
            }
        }
    }

    async function handleGallery() {
        if (isNative()) {
            const photo = await pickFromGallery()
            if (photo) await uploadDataUrl(photo.dataUrl)
        } else {
            // Web: trigger file input without capture
            if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture")
                fileInputRef.current.click()
            }
        }
    }

    async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string
            if (dataUrl) await uploadDataUrl(dataUrl)
        }
        reader.readAsDataURL(file)

        // Reset input
        e.target.value = ""
    }

    function handleRemove() {
        setPreview(null)
        onChange(null)
    }

    return (
        <div className={cn("space-y-2", className)}>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Comprovante
            </label>

            {preview ? (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Comprovante"
                        className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleCamera}
                        disabled={uploading}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors",
                            "hover:border-primary hover:text-primary hover:bg-primary/5",
                            uploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Camera className="h-4 w-4" />
                        )}
                        Câmera
                    </button>
                    <button
                        type="button"
                        onClick={handleGallery}
                        disabled={uploading}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors",
                            "hover:border-primary hover:text-primary hover:bg-primary/5",
                            uploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="h-4 w-4" />
                        )}
                        Galeria
                    </button>
                </div>
            )}

            {/* Hidden file input for web fallback */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInput}
                className="hidden"
            />
        </div>
    )
}
