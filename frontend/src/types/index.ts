// Add credential types to the existing types file
export type PostStatus = 'DRAFT' | 'READY' | 'PUBLISHED';

export type PlatformPublishStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'MANUAL_REQUIRED';

export interface PlatformStatus {
  status: PlatformPublishStatus;
  url?: string | null;
  platformId?: string | null;
  publishedAt?: string | null;
  error?: string | null;
  threadIds?: string[];
}

export interface Post {
  id: string;
  title: string;
  bodyMarkdown: string;
  tags: string[];
  coverImageUrl?: string | null;
  status: PostStatus;
  sourceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  lastAutosavedAt: string;
  platforms: Record<string, PlatformStatus>;
}

export interface PostCreateRequest {
  title: string;
  bodyMarkdown: string;
  tags?: string[];
  coverImageUrl?: string;
  sourceUrl?: string;
}

export interface PostAutosaveRequest {
  bodyMarkdown: string;
}

export interface PublishRequest {
  platforms: string[];
  credentials?: Record<string, PlatformCredentials>;
}

export interface PlatformCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface PreviewResponse {
  previews: Record<string, FormattedContentResponse>;
}

export interface FormattedContentResponse {
  type: 'SINGLE_BODY' | 'CHUNKED' | 'UNKNOWN';
  title?: string;
  body?: string;
  tags?: string[];
  chunks?: string[];
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: number;
  errors?: Record<string, string[]>;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface CredentialStatusResponse {
  platform: string;
  connected: boolean;
  connectedAt: string;
}

export interface SaveCredentialRequest {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
}