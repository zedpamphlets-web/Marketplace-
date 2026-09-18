import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

export type ImageKind = "icon" | "banner" | "product";

const QUALITY: Record<ImageKind, number> = {
  icon: 0.45, // small category icons — light load
  banner: 0.55, // home banners — balanced
  product: 0.65, // product photos
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

/** Upload a local image URI to Supabase Storage and return public URL. */
export async function uploadImageFromUri(
  uri: string,
  folder: string,
  fileName?: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const name = fileName || `${Date.now()}.jpg`;
    const path = `${folder}/${name}`;
    const res = await fetch(uri);
    const blob = await res.blob();
    const contentType = blob.type || "image/jpeg";

    const { error } = await supabase.storage.from("public-assets").upload(path, blob, {
      contentType,
      upsert: true,
    });
    if (error) {
      const retry = await supabase.storage.from("images").upload(path, blob, {
        contentType,
        upsert: true,
      });
      if (retry.error) return { url: null, error: retry.error.message || error.message };
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    }
    const { data } = supabase.storage.from("public-assets").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message || "Upload failed" };
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
