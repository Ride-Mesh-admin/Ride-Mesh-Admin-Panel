export type UserRole = "rider" | "host";
export type UserStatus = "active" | "suspended";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinDate: string;
  avatarColor: "orange" | "purple" | "teal" | "green" | "blue";
}
