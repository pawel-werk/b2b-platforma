import { upload } from '@vercel/blob/client';

export async function uploadFileToBlob(file: File): Promise<string> {
  // Funkcja wywoływana po stronie klienta (przeglądarki)
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });
  return blob.url;
}