import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";

export type ImageKind = "icon" | "banner" | "product";

const QUALITY: Record<ImageKind, number> = {
  icon: 0.45,
  banner: 0.55,
  product: 0.65,
};

/** Open gallery, crop, return local URI (compressed by quality). */
export async function pickImageFromPhone(
  kind: ImageKind = "product"
): Promise<{ uri: string | null; error: string | null }> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return { uri: null, error: "Allow photo access to pick images from your phone." };
    }
    const aspect: [number, number] = kind === "banner" ? [16, 9] : [1, 1];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: QUALITY[kind],
    });
    if (result.canceled || !result.assets?.[0]?.uri) {
      return { uri: null, error: null };
    }
    return { uri: result.assets[0].uri, error: null };
  } catch (e: any) {
    return { uri: null, error: e?.message || "Could not open gallery" };
  }
}

/**
 * Upload a local image URI to Supabase Storage and return public URL.
 * Uses base64 → ArrayBuffer (required on React Native; fetch(uri).blob() fails).
 */
export async function uploadImageFromUri(
  uri: string,
  folder: string,
  fileName?: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const name = fileName || `${Date.now()}.jpg`;
    const path = `${folder}/${name}`;

    // Read file as base64 — works with file:// and content:// URIs on device
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) {
      return { url: null, error: "Could not read image file" };
    }

    const arrayBuffer = decode(base64);
    const contentType = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

    // Prefer public-assets, fall back to images (both documented in schema)
    let uploadedBucket = "public-assets";
    const { error } = await supabase.storage.from("public-assets").upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      const retry = await supabase.storage.from("images").upload(path, arrayBuffer, {
        contentType,
        upsert: true,
      });
      if (retry.error) {
        return {
          url: null,
          error:
            retry.error.message ||
            error.message ||
            "Upload failed. Check Storage bucket + policies in Supabase.",
        };
      }
      uploadedBucket = "images";
    }

    const { data } = supabase.storage.from(uploadedBucket).getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e: any) {
    const msg = e?.message || "Upload failed";
    // Surface the classic RN failure more clearly
    if (/network request failed/i.test(msg)) {
      return {
        url: null,
        error: "Could not read image on device. Try another photo or restart the app.",
      };
    }
    return { url: null, error: msg };
  }
}

/** Pick from phone + upload in one step. */
export async function pickAndUpload(
  kind: ImageKind,
  folder: string
): Promise<{ url: string | null; localUri: string | null; error: string | null }> {
  const picked = await pickImageFromPhone(kind);
  if (picked.error) return { url: null, localUri: null, error: picked.error };
  if (!picked.uri) return { url: null, localUri: null, error: null };
  const up = await uploadImageFromUri(picked.uri, folder, `${kind}-${Date.now()}.jpg`);
  return { url: up.url, localUri: picked.uri, error: up.error };
}
