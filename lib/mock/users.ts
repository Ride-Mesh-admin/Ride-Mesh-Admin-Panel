import type { User } from "@/lib/types/user";

export const mockUsers: User[] = [
  {
    id: "1",
    username: "alex_rider88",
    email: "alex.v@ridemesh.io",
    role: "rider",
    status: "active",
    joinDate: "OCT 12, 2023",
    avatarColor: "orange",
  },
  {
    id: "2",
    username: "clara_kane",
    email: "clara.k@ridemesh.io",
    role: "host",
    status: "active",
    joinDate: "NOV 03, 2023",
    avatarColor: "purple",
  },
  {
    id: "3",
    username: "mike_trail",
    email: "mike.t@ridemesh.io",
    role: "rider",
    status: "active",
    joinDate: "DEC 18, 2023",
    avatarColor: "teal",
  },
  {
    id: "4",
    username: "sam_driver",
    email: "sam.d@ridemesh.io",
    role: "host",
    status: "suspended",
    joinDate: "JAN 05, 2024",
    avatarColor: "green",
  },
  {
    id: "5",
    username: "taylor_mesh",
    email: "taylor.m@ridemesh.io",
    role: "rider",
    status: "active",
    joinDate: "FEB 02, 2024",
    avatarColor: "blue",
  },
];

export const TOTAL_USER_COUNT = 2401;
export const USERS_PER_PAGE = 5;
