import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

export async function uploadFile(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Bezpieczna nazwa pliku (usuwamy spacje i dziwne znaki)
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  
  const uploadDir = path.join(process.cwd(), "public/uploads");
  
  // Upewnij się, że folder istnieje, zanim spróbujesz zapisać
  if (!fs.existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);
  
  // Zwracamy publiczny adres URL do bazy danych
  return `/uploads/${filename}`;
}