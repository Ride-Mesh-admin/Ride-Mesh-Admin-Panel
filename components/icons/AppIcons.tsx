type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    className,
    "aria-hidden": true as const,
  };
}

/** assets/rider/sos.svg */
export function SosIcon({ size = 24, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, className)} viewBox="0 0 24 27">
      <path
        d="M19 10.2007L18.3 9.50072C14.8206 6.02132 9.1794 6.02132 5.7 9.50071L5 10.2007M23 6.20071L21.9 5.10071C16.4324 -0.366904 7.56762 -0.366905 2.1 5.10071L1 6.20071"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M11.9999 19.9533C13.1487 19.9533 14.0799 19.0221 14.0799 17.8733C14.0799 16.7246 13.1487 15.7933 11.9999 15.7933C10.8512 15.7933 9.91992 16.7246 9.91992 17.8733C9.91992 19.0221 10.8512 19.9533 11.9999 19.9533Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M6.4133 16.66C7.72664 10.8867 16.28 10.8934 17.5866 16.6667C18.3533 20.0534 16.2466 22.92 14.4 24.6934C13.06 25.9867 10.94 25.9867 9.5933 24.6934C7.7533 22.92 5.64664 20.0467 6.4133 16.66Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

/** assets/rider/help.svg */
export function HelpIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)} viewBox="0 0 22 22">
      <path
        d="M8 8L8.33531 6.99408C9.03889 4.88332 11.8236 4.43143 13.1585 6.21138C13.9405 7.25403 13.886 8.70175 13.0277 9.68259L12.1085 10.7331C11.3939 11.5498 11 12.5982 11 13.6834V14M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17C12 17.5523 11.5523 18 11 18C10.4477 18 10 17.5523 10 17C10 16.4477 10.4477 16 11 16C11.5523 16 12 16.4477 12 17Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Ionicons hand-left used for Stop on SafetySignalsScreen */
export function HandIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M8.5 11.5V6.75a1.25 1.25 0 0 1 2.5 0V11M11 11V4.75a1.25 1.25 0 0 1 2.5 0V11M13.5 11V5.75a1.25 1.25 0 0 1 2.5 0V12.5M16 12.2V8.75a1.25 1.25 0 0 1 2.5 0v5.35c0 3.1-2.15 5.4-5.35 5.4H12.4c-1.45 0-2.8-.55-3.8-1.5L5 14.2a1.65 1.65 0 0 1 2.35-2.3L8.5 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** assets/rider/warning.svg */
export function WarningIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)} viewBox="0 0 52 52">
      <path
        d="M25.7142 17.1428V30M25.7142 36.4286V36.45M32.5104 4.28571H18.918C17.7813 4.28571 16.6913 4.73724 15.8875 5.54096L5.5409 15.8876C4.73717 16.6913 4.28564 17.7814 4.28564 18.918V32.5105C4.28564 33.6471 4.73717 34.7372 5.5409 35.541L15.8875 45.8876C16.6913 46.6913 17.7813 47.1428 18.918 47.1428H32.5104C33.6471 47.1428 34.7372 46.6913 35.5409 45.8876L45.8875 35.541C46.6913 34.7372 47.1428 33.6471 47.1428 32.5105V18.918C47.1428 17.7814 46.6913 16.6913 45.8875 15.8876L35.5409 5.54096C34.7372 4.73724 33.6471 4.28571 32.5104 4.28571Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/tracking screen/Convoy/chat.svg */
export function ChatIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 11H16.01" stroke="currentColor" strokeWidth={Math.max(strokeWidth, 2)} strokeLinecap="round" />
      <path d="M12 11H12.01" stroke="currentColor" strokeWidth={Math.max(strokeWidth, 2)} strokeLinecap="round" />
      <path d="M8 11H8.01" stroke="currentColor" strokeWidth={Math.max(strokeWidth, 2)} strokeLinecap="round" />
    </svg>
  );
}

/** assets/tracking screen/flag.svg */
export function FlagIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M5 22V14M5 14V4M5 14L7.47067 13.5059C9.1212 13.1758 10.8321 13.3328 12.3949 13.958C14.0885 14.6354 15.9524 14.7619 17.722 14.3195L17.9364 14.2659C18.5615 14.1096 19 13.548 19 12.9037V5.53669C19 4.75613 18.2665 4.18339 17.5092 4.3727C15.878 4.78051 14.1597 4.66389 12.5986 4.03943L12.3949 3.95797C10.8321 3.33284 9.1212 3.17576 7.47067 3.50587L5 4M5 4V2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/rider/Map Point Search.svg */
export function MapPointIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M4 10.1433C4 5.64588 7.58172 2 12 2C16.4183 2 20 5.64588 20 10.1433C20 14.6055 17.4467 19.8124 13.4629 21.6744C12.5343 22.1085 11.4657 22.1085 10.5371 21.6744C6.55332 19.8124 4 14.6055 4 10.1433Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <path
        d="M14.1249 12.1178L15.5 13.5M14.1249 12.1178C14.6657 11.5752 15 10.8266 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13C12.8302 13 13.5817 12.6628 14.1249 12.1178Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/rider/users.svg / seats */
export function UsersIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M18 9C19.6569 9 21 7.88071 21 6.5C21 5.11929 19.6569 4 18 4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M6 9C4.34315 9 3 7.88071 3 6.5C3 5.11929 4.34315 4 6 4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <ellipse cx="12" cy="17" rx="6" ry="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M20 19C21.7542 18.6153 23 17.6411 23 16.5C23 15.3589 21.7542 14.3847 20 14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M4 19C2.24575 18.6153 1 17.6411 1 16.5C1 15.3589 2.24575 14.3847 4 14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/rider/driving.svg / convoy rides */
export function VehicleIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M14.55 2H9.44995C7.64995 2 7.24996 2.90001 7.01996 4.01001L6.19995 7.92999H17.8L16.9799 4.01001C16.7499 2.90001 16.35 2 14.55 2Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.2401 14.3199C19.3201 15.1699 18.6401 15.9 17.7701 15.9H16.4101C15.6301 15.9 15.5201 15.57 15.3801 15.15L15.23 14.7199C15.03 14.1299 14.9001 13.7299 13.8501 13.7299H10.1401C9.10005 13.7299 8.94005 14.1799 8.76005 14.7199L8.61005 15.15C8.47005 15.56 8.36006 15.9 7.58006 15.9H6.22005C5.35005 15.9 4.67005 15.1699 4.75005 14.3199L5.16006 9.89996C5.26006 8.80996 5.47005 7.91992 7.37005 7.91992H16.62C18.52 7.91992 18.7301 8.80996 18.8301 9.89996L19.2401 14.3199Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.2 5.75H5.47" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M18.53 5.75H17.8" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M7.65 10.83H9.82" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M14.18 10.83H16.35" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 17V18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M12 21V22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M3 18L2 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M21 18L22 22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

/** assets/rider/Bike.svg */
export function BikeIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M19.5 19C20.8807 19 22 17.8807 22 16.5C22 15.1193 20.8807 14 19.5 14C18.1193 14 17 15.1193 17 16.5C17 17.8807 18.1193 19 19.5 19Z"
        stroke="currentColor"
      />
      <path
        d="M14.416 18C14.0494 17.1607 13.9203 16.2368 14.0429 15.3292C14.1655 14.4216 14.5351 13.5651 15.1112 12.8531C15.6874 12.1412 16.448 11.6012 17.3101 11.292C18.1722 10.9829 19.1027 10.9164 20 11.1"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M4.5 19C5.88071 19 7 17.8807 7 16.5C7 15.1193 5.88071 14 4.5 14C3.11929 14 2 15.1193 2 16.5C2 17.8807 3.11929 19 4.5 19Z"
        stroke="currentColor"
      />
      <path
        d="M6.43 9.63H8.157C8.61237 9.62982 9.05404 9.47424 9.409 9.189L11.237 7.72C11.4148 7.57734 11.636 7.49972 11.864 7.5H15L12.284 12.479C12.1979 12.6367 12.071 12.7683 11.9165 12.86C11.762 12.9517 11.5857 13 11.406 13H9.5M6.43 9.63H4M6.43 9.63L9.5 13M9.5 13L7 16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 11L13.992 5.736C13.587 5.028 13.385 4.674 13.083 4.434C12.931 4.3132 12.7622 4.21517 12.582 4.143C12.224 4 11.816 4 11 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Motorcycle helmet — convoy lead marker */
export function HelmetIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M4.5 13.5c0-4.5 3.2-8 7.5-8s7.5 3.5 7.5 8v1.2c0 .7-.4 1.3-1 1.5l-1.2.4c-.5.15-1 .6-1 1.15V18H10v-.25c0-.55-.4-1-1-1.15l-2.3-.7c-.7-.2-1.2-.85-1.2-1.55V13.5z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M5 14.2h14"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M12 5.5V8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/rider/activeRides.svg — ATV-style */
export function AtvIcon({ size = 24, className, strokeWidth = 1.5 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M12.14 7.62H6.87001C5.01001 7.62 4.59002 8.55001 4.36002 9.70001L3.51001 13.75H15.51L14.66 9.70001C14.41 8.55001 14 7.62 12.14 7.62Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.0077 20.62C17.0877 21.5 16.3877 22.26 15.4877 22.26H14.0777C13.2677 22.26 13.1577 21.91 13.0077 21.49L12.8577 21.04C12.6477 20.43 12.5077 20.01 11.4277 20.01H7.58771C6.50771 20.01 6.3477 20.48 6.1577 21.04L6.00771 21.49C5.86771 21.92 5.7577 22.26 4.9377 22.26H3.5277C2.6277 22.26 1.91771 21.5 2.00771 20.62L2.4277 16.05C2.5377 14.92 2.7477 14 4.7177 14H14.2877C16.2577 14 16.4677 14.92 16.5777 16.05L17.0077 20.62Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 11.5H2.75" stroke="currentColor" strokeLinecap="round" />
      <path d="M16.25 11.5H15.5" stroke="currentColor" strokeLinecap="round" />
      <path d="M5 16.75H7.25" stroke="currentColor" strokeLinecap="round" />
      <path d="M11.75 16.75H14" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M18.71 8.74C18.99 8.09 18.89 7.21 18.37 6.44C17.86 5.67 17.08 5.24 16.37 5.25"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M21.82 9.73C22.24 8.22 21.94 6.37 20.87 4.77C19.8 3.17 18.2 2.19 16.64 2"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/rider/duration.svg */
export function DurationIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.7099 15.18L12.6099 13.33C12.0699 13.01 11.6299 12.24 11.6299 11.61V7.51001"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** assets/rider/miles.svg / mapOrange route */
export function MilesIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M9 6.5L5.7305 8.13475C4.66993 8.66503 4 9.74901 4 10.9348C4 13.2619 6.44902 14.7755 8.53049 13.7348L15.4695 10.2652C17.551 9.22451 20 10.7381 20 13.0652C20 14.251 19.3301 15.335 18.2695 15.8652L15 17.5M15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5ZM15 19C15 20.6569 13.6569 22 12 22C10.3431 22 9 20.6569 9 19C9 17.3431 10.3431 16 12 16C13.6569 16 15 17.3431 15 19Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** assets/host/.../calendar.svg */
export function CalendarIcon({ size = 24, className, strokeWidth = 1.75 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M8 2V5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 2V5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 9.09H20.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.995 14H12.005" stroke="currentColor" strokeWidth={Math.max(strokeWidth, 2)} strokeLinecap="round" />
      <path d="M8.29 14H8.3" stroke="currentColor" strokeWidth={Math.max(strokeWidth, 2)} strokeLinecap="round" />
      <path d="M8.29 17H8.3" stroke="currentColor" strokeWidth={Math.max(strokeWidth, 2)} strokeLinecap="round" />
    </svg>
  );
}

/** assets/rider/send.svg — broadcast */
export function SendIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M7.40005 6.31997L15.8901 3.48997C19.7001 2.21997 21.7701 4.29997 20.5101 8.10997L17.6801 16.6C15.7801 22.31 12.6601 22.31 10.7601 16.6L9.92005 14.08L7.40005 13.24C1.69005 11.34 1.69005 8.22997 7.40005 6.31997Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.11 13.65L13.69 10.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** assets/rider/Shield.svg */
export function ShieldIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M3 11L12 8L21 11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2V21.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** assets/rider/plus.svg */
export function PlusIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 4V20M20 12L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Mountain / difficulty — simple line to match app style */
export function TerrainIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M2 18L8.5 8.5L12 13.5L15 9.5L22 18H2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14.5 12.5L16.5 9.5L19 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
