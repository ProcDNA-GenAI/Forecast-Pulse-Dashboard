export type AuthMode = "demo" | "sso";

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  department: string | null;
  jobTitle: string | null;
  profileUrl: string | null;
  expiresAt: string;
};

export type CurrentUserResponse = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  is_admin?: boolean;
  department?: string | null;
  job_title?: string | null;
  profile_url?: string | null;
  expires_at: string;
};
