import { env } from "@/env";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export interface StorageDriver {
  upload(fileName: string, buffer: Buffer): Promise<string>;
}

export const storage: StorageDriver = {
  async upload(fileName, buffer) {
    if (env.STORAGE_DRIVER === "local") {
      const uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, fileName), buffer);
      return `/api/files/${fileName}`;
    } else {
      const { url } = await put(fileName, buffer, { access: "public", token: env.BLOB_READ_WRITE_TOKEN });
      return url;
    }
  }
};
