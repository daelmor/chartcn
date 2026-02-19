import { createHash } from "node:crypto";
import {
  BlobServiceClient,
  ContainerClient,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
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

export class AzureBlobStore implements BlobStore {
  private configsContainer: ContainerClient;
  private imagesContainer: ContainerClient;

  constructor(accountName?: string, connectionString?: string) {
    let client: BlobServiceClient;

    if (connectionString) {
      client = BlobServiceClient.fromConnectionString(connectionString);
    } else if (accountName) {
      const credential = new DefaultAzureCredential();
      client = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential
      );
    } else {
      throw new Error(
        "AzureBlobStore requires AZURE_STORAGE_ACCOUNT_NAME or AZURE_STORAGE_CONNECTION_STRING"
      );
    }

    this.configsContainer = client.getContainerClient("configs");
    this.imagesContainer = client.getContainerClient("images");
  }

  async init(): Promise<void> {
    await this.configsContainer.createIfNotExists();
    await this.imagesContainer.createIfNotExists();
  }

  async saveConfig(chartId: string, config: ChartRequest): Promise<void> {
    const prefix = blobPrefix(chartId);
    const blobPath = `${prefix}/${chartId}/config.json`;
    const blob = this.configsContainer.getBlockBlobClient(blobPath);
    const body = JSON.stringify(config);
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
  }

  async getConfig(chartId: string): Promise<ChartRequest | null> {
    const prefix = blobPrefix(chartId);
    const blobPath = `${prefix}/${chartId}/config.json`;
    const blob = this.configsContainer.getBlockBlobClient(blobPath);

    try {
      const response = await blob.download(0);
      const body = await streamToBuffer(response.readableStreamBody!);
      return JSON.parse(body.toString()) as ChartRequest;
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
    const blobPath = `${prefix}/${chartId}/${key}`;
    const blob = this.imagesContainer.getBlockBlobClient(blobPath);
    await blob.upload(data, data.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });
  }

  async getImage(
    chartId: string,
    key: string
  ): Promise<{ data: Buffer; contentType: string } | null> {
    const prefix = blobPrefix(chartId);
    const blobPath = `${prefix}/${chartId}/${key}`;
    const blob = this.imagesContainer.getBlockBlobClient(blobPath);

    try {
      const response = await blob.download(0);
      const data = await streamToBuffer(response.readableStreamBody!);
      const contentType = response.contentType ?? "application/octet-stream";
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
    "statusCode" in err &&
    (err as { statusCode: number }).statusCode === 404
  );
}

async function streamToBuffer(
  stream: NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as unknown as Uint8Array));
  }
  return Buffer.concat(chunks);
}
