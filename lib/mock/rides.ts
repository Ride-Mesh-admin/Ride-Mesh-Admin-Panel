import type { RideListItem } from "@/lib/types/ride";
import type { RideDetail } from "@/lib/types/ride";

export const mockRidesList: RideListItem[] = [
  {
    id: "1",
    title: "Commute to Tech Hub (South District)",
    rideId: "RM-98231",
    postedAgo: "2h ago",
    hostName: "Marcus Webb",
    hostAvatarColor: "orange",
    hostRating: 4.2,
    reportCount: 8,
    status: "under_review",
  },
  {
    id: "2",
    title: "Night Shift Transfer - Medical Center",
    rideId: "RM-98245",
    postedAgo: "5h ago",
    hostName: "Sarah Jenkins",
    hostAvatarColor: "purple",
    hostRating: 4.9,
    reportCount: 0,
    status: "active",
  },
  {
    id: "3",
    title: "Inter-City Express: Seattle to Portland",
    rideId: "RM-98256",
    postedAgo: "1h ago",
    hostName: "David Ross",
    hostAvatarColor: "teal",
    hostRating: 3.8,
    reportCount: 2,
    status: "reported",
  },
  {
    id: "4",
    title: "Daily Commute to Financial District",
    rideId: "RM-98288",
    postedAgo: "30m ago",
    hostName: "Linda Gao",
    hostAvatarColor: "green",
    hostRating: 2.1,
    reportCount: 0,
    status: "flagged_ai",
  },
];

export const mockRideDetails: Record<string, RideDetail> = {
  "1": {
    id: "1",
    rideId: "RM-98231",
    riskLevel: "high",
    title: "Commute to Tech Hub",
    description:
      "Direct route, fast lane. No pets allowed. Leaving promptly at 8:00 AM.",
    pickup: "Downtown Station",
    dropoff: "South Tech Hub",
    reportCount: 8,
    reportLogs: [
      {
        id: "1",
        title: "Harassment",
        timestamp: "14m ago",
        description:
          "Host sent inappropriate messages after booking request.",
      },
      {
        id: "2",
        title: "Spam",
        timestamp: "1h ago",
        description: "Duplicate ride posting detected for same time slot.",
      },
    ],
    hostReputation: {
      memberSince: "Jan 2023",
      ridesHosted: 142,
      pastWarnings: 1,
    },
  },
  "2": {
    id: "2",
    rideId: "RM-98245",
    title: "Night Shift Transfer - Medical Center",
    description: "Quiet ride, hospital staff preferred.",
    pickup: "Central Depot",
    dropoff: "Medical Center East",
    reportCount: 0,
    reportLogs: [],
    hostReputation: {
      memberSince: "Mar 2022",
      ridesHosted: 89,
      pastWarnings: 0,
    },
  },
  "3": {
    id: "3",
    rideId: "RM-98256",
    title: "Inter-City Express: Seattle to Portland",
    description: "Long-distance shared ride.",
    pickup: "Seattle Central",
    dropoff: "Portland Downtown",
    reportCount: 2,
    reportLogs: [],
    hostReputation: {
      memberSince: "Jun 2023",
      ridesHosted: 24,
      pastWarnings: 0,
    },
  },
  "4": {
    id: "4",
    rideId: "RM-98288",
    title: "Daily Commute to Financial District",
    description: "Regular commuter route.",
    pickup: "Residential North",
    dropoff: "Financial District",
    reportCount: 0,
    reportLogs: [],
    hostReputation: {
      memberSince: "Sep 2023",
      ridesHosted: 12,
      pastWarnings: 0,
    },
  },
};

export const RIDE_MOD_STATS = {
  activeRides: 1284,
  reported: 42,
  moderatorsOnline: 7,
};
