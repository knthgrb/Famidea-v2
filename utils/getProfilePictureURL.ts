export const getProfilePictureURL = (filename?: string) => {
  if (!filename) return "/default-avatar.png";
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-pictures/${filename}`;
};
