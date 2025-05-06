export type BirthCenter = {
  id: string;
  name: string;
  address: string;
  contact_number: string;
  status: "pending" | "approved" | "rejected" | "banned";
  created_at: string;
  description?: string;
};
