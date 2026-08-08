import { createHash } from "node:crypto";
import { Storage, type Bucket } from "@google-cloud/storage";
import type { ChartRequest } from "../schemas/chart-config.js";

export interface BlobStore {
  saveConfig(chartId: string, config: ChartRequest): Promise<void>;
  getConfig(chartId: string): Promise<ChartRequest | null>;
  saveImage(chartId: string, key: string, data: Buffer, contentType: string): Promise<void>;
  getImage(chartId: string, key: string): Promise<{ data: Buffer; contentType: string } | null>;
}

function blobPrefix(chartId: string): string {
  const hash = createHash("sha256").update(chartId).digest("hex");
  return hash.slice(0, 2);
}

export class GcsBlobStore implements BlobStore {
  private bucket: Bucket;

  constructor(bucketName: string) {
    if (!bucketName) {
      throw new Error("GcsBlobStore requires GCS_BUCKET");
    }

    const client = new Storage();
    this.bucket = client.bucket(bucketName);
  }

  async init(): Promise<void> {
    // GCS buckets are pre-created by infra — nothing to provision here.
  }

  async saveConfig(chartId: string, config: ChartRequest): Promise<void> {
    const prefix = blobPrefix(chartId);
    const objectPath = `configs/${prefix}/${chartId}/config.json`;
    const body = JSON.stringify(config);
    await this.bucket.file(objectPath).save(body, {
      contentType: "application/json",
    });
  }

  async getConfig(chartId: string): Promise<ChartRequest | null> {
    const prefix = blobPrefix(chartId);
    const objectPath = `configs/${prefix}/${chartId}/config.json`;

    try {
      const [data] = await this.bucket.file(objectPath).download();
      return JSON.parse(data.toString()) as ChartRequest;
    } catch (err: unknown) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  async saveImage(
    chartId: string,
    key: string,
    data: Buffer,
    contentType: string
  ): Promise<void> {
    const prefix = blobPrefix(chartId);
    const objectPath = `images/${prefix}/${chartId}/${key}`;
    await this.bucket.file(objectPath).save(data, { contentType });
  }

  async getImage(
    chartId: string,
    key: string
  ): Promise<{ data: Buffer; contentType: string } | null> {
    const prefix = blobPrefix(chartId);
    const objectPath = `images/${prefix}/${chartId}/${key}`;
    const file = this.bucket.file(objectPath);

    try {
      const [data] = await file.download();
      const [metadata] = await file.getMetadata();
      const contentType = metadata.contentType ?? "application/octet-stream";
      return { data, contentType };
    } catch (err: unknown) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }
}

function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 404
  );
}
