'use client';

import { supabase } from '@/config/supabase';

const MAX_SOURCE_SIZE = 15 * 1024 * 1024;
const MAX_OUTPUT_SIZE = 600 * 1024;
const MAX_DIMENSION = 1200;
const BUCKET = 'prize-images';

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Unable to compress this image.')),
      'image/webp',
      quality
    );
  });
}

export async function compressPrizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new Error('Please choose a JPG, PNG, or WebP image.');
  }
  if (file.size > MAX_SOURCE_SIZE) throw new Error('The original image must be smaller than 15 MB.');

  const image = await createImageBitmap(file);
  let scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression is not supported in this browser.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, Math.max(0.55, 0.82 - attempt * 0.07));
    if (blob.size <= MAX_OUTPUT_SIZE) break;
    scale *= 0.82;
  }
  image.close();
  if (!blob) throw new Error('Unable to compress this image.');
  return blob;
}

export async function uploadPrizeImage(file: File) {
  const compressedImage = await compressPrizeImage(file);
  const imagePath = `${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(imagePath, compressedImage, {
    contentType: 'image/webp',
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    imageUrl: supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl,
    imagePath,
    compressedSize: compressedImage.size,
  };
}

export async function deletePrizeImage(imagePath?: string) {
  if (!imagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([imagePath]);
  if (error) console.warn('Unable to delete prize image:', error.message);
}
