import { supabase } from "../config/supabase";

export const ALLOWED_BUCKETS = [
  "imports",
  "documents",
  "reports",
] as const;

export type StorageBucket = typeof ALLOWED_BUCKETS[number];

const validateBucket = (bucket: string): StorageBucket => {
  if (!ALLOWED_BUCKETS.includes(bucket as StorageBucket)) {
    throw new Error(`Invalid storage bucket: ${bucket}`);
  }

  return bucket as StorageBucket;
};

export const uploadFile = async (
  bucket: StorageBucket,
  filePath: string,
  file: Buffer,
  contentType: string
) => {
  const validBucket = validateBucket(bucket);

  const { data, error } = await supabase.storage
    .from(validBucket)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return data;
};

export const downloadFile = async (
  bucket: StorageBucket,
  filePath: string
) => {
  const validBucket = validateBucket(bucket);

  const { data, error } = await supabase.storage
    .from(validBucket)
    .download(filePath);

  if (error) {
    throw new Error(`Storage download failed: ${error.message}`);
  }

  return data;
};

export const deleteFile = async (
  bucket: StorageBucket,
  filePath: string
) => {
  const validBucket = validateBucket(bucket);

  const { data, error } = await supabase.storage
    .from(validBucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }

  return data;
};

export const getSignedUrl = async (
  bucket: StorageBucket,
  filePath: string,
  expiresIn = 3600
) => {
  const validBucket = validateBucket(bucket);

  const { data, error } = await supabase.storage
    .from(validBucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(`Signed URL creation failed: ${error.message}`);
  }

  return data.signedUrl;
};
