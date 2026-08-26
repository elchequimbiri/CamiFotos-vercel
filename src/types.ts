export type UserRole = 'family' | 'admin';

export interface UserSession {
  token: string;
  role: UserRole;
  displayName: string;
  loginTime: string;
}

export interface Photo {
  id: string;
  filename: string;
  title: string;
  caption?: string;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  dateAdded: string;
  captureDate?: string;
  isCover?: boolean;
  viewsCount?: number;
}

export interface Gallery {
  id: string;
  name: string;
  slug: string;
  description: string;
  subtitle?: string;
  year: number;
  coverImage?: string;
  dateCreated: string;
  photos: Photo[];
  isPrivate?: boolean;
  viewsCount?: number;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  role: UserRole;
  action: 'login' | 'view_gallery' | 'view_photo' | 'admin_action';
  galleryName?: string;
  photoTitle?: string;
  details?: string;
  userAgent?: string;
}

export interface AccessStatsSummary {
  totalLogins: number;
  familyLogins: number;
  adminLogins: number;
  totalGalleryViews: number;
  totalPhotoViews: number;
  recentLogs: AccessLog[];
  galleryPopularity: { galleryName: string; count: number }[];
  photoPopularity: { photoTitle: string; galleryName: string; count: number }[];
}
