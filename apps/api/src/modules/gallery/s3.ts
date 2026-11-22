import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env';
import { AppError } from '../../shared/app-error';

export interface S3ServiceOperations {
  getBucketName(): string;
  createPresignedPutUrl(
    s3ObjectKey: string,
    mimeType: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  createPresignedGetUrl(
    s3ObjectKey: string,
    options?: {
      expiresInSeconds?: number;
      downloadFileName?: string;
    },
  ): Promise<string>;
  deleteObject(s3ObjectKey: string): Promise<void>;
  headObject(
    s3ObjectKey: string,
  ): Promise<{ exists: boolean; sizeBytes?: number; mimeType?: string }>;
}

export function createS3Client(): S3Client {
  const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
    region: env.AWS_REGION || 'us-east-1',
    // Disable automatic empty-payload checksum injection on pre-signed URLs
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  };

  // If explicit credentials are provided via environment variables, use them:
  if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    };
  }
  // Otherwise, AWS SDK for JavaScript v3 defaults to the standard AWS credential provider chain:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)
  // 2. SSO credentials / AWS CLI profile (~/.aws/credentials, ~/.aws/config)
  // 3. Container / IAM Task role credentials (ECS, EKS, EC2 metadata)

  return new S3Client(clientConfig);
}

export function createS3Service(client?: S3Client): S3ServiceOperations {
  const s3Client = client ?? createS3Client();
  const bucketName = env.AWS_S3_BUCKET_NAME || 'make-my-marriage-gallery-dev-rana-2026';
  const region = env.AWS_REGION || 'us-east-1';

  if (env.AWS_ACCESS_KEY_ID) {
    const masked = `${env.AWS_ACCESS_KEY_ID.slice(0, 4)}...${env.AWS_ACCESS_KEY_ID.slice(-4)}`;
    console.info(
      `[Gallery S3] Initialized for bucket '${bucketName}' in '${region}' using credentials from .env (${masked}).`,
    );
  } else {
    console.info(
      `[Gallery S3] Initialized for bucket '${bucketName}' in '${region}' using AWS default credential provider chain.`,
    );
  }

  return {
    getBucketName() {
      return bucketName;
    },

    async createPresignedPutUrl(
      s3ObjectKey: string,
      mimeType: string,
      expiresInSeconds: number = env.AWS_S3_PRESIGNED_EXPIRES_SECONDS,
    ): Promise<string> {
      try {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: s3ObjectKey,
          ContentType: mimeType,
        });
        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
      } catch (error) {
        const errMessage = (error as Error)?.message || String(error);
        console.error('[Gallery S3] Failed to generate pre-signed PUT URL:', errMessage);

        const isCredentialError =
          errMessage.includes('Could not load credentials') ||
          errMessage.includes('credentials') ||
          errMessage.includes('Missing credentials');

        throw new AppError(
          500,
          'AWS_S3_PRESIGN_FAILED',
          isCredentialError
            ? 'AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file to enable direct S3 uploads.'
            : `Failed to generate AWS S3 upload URL: ${errMessage}`,
        );
      }
    },

    async createPresignedGetUrl(
      s3ObjectKey: string,
      options?: {
        expiresInSeconds?: number;
        downloadFileName?: string;
      },
    ): Promise<string> {
      try {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: s3ObjectKey,
          ...(options?.downloadFileName
            ? {
                ResponseContentDisposition: `attachment; filename="${encodeURIComponent(options.downloadFileName)}"`,
              }
            : {}),
        });
        return await getSignedUrl(s3Client, command, {
          expiresIn: options?.expiresInSeconds || env.AWS_S3_PRESIGNED_EXPIRES_SECONDS,
        });
      } catch (error) {
        console.warn(`[Gallery S3] Could not generate pre-signed GET URL for ${s3ObjectKey}:`, (error as Error).message);
        return '';
      }
    },

    async deleteObject(s3ObjectKey: string): Promise<void> {
      try {
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: s3ObjectKey,
        });
        await s3Client.send(command);
      } catch (error) {
        console.warn(`[Gallery S3] Failed to delete S3 object ${s3ObjectKey}:`, (error as Error).message);
      }
    },

    async headObject(
      s3ObjectKey: string,
    ): Promise<{ exists: boolean; sizeBytes?: number; mimeType?: string }> {
      try {
        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: s3ObjectKey,
        });
        const res = await s3Client.send(command);
        return {
          exists: true,
          sizeBytes: res.ContentLength,
          mimeType: res.ContentType,
        };
      } catch (err: unknown) {
        const name = (err as { name?: string })?.name;
        const statusCode = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
        if (name === 'NotFound' || statusCode === 404) {
          return { exists: false };
        }
        console.warn(`[Gallery S3] HeadObject check failed for ${s3ObjectKey}:`, err);
        return { exists: false };
      }
    },
  };
}

export const defaultS3Service = createS3Service();
