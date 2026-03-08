/**
 * Custom SVG Brand Icons for SocialGuard
 * Hand-crafted brand identity icons using Discord-inspired Blurple palette.
 */

// ─── Brand Shield Logo ─────────────────────────────────────
// Main brand mark: a shield with a radar/scan wave inside
export const BrandLogo = ({ size = 24, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Shield body */}
        <path
            d="M16 2L4 8v8c0 7.73 5.12 14.95 12 16 6.88-1.05 12-8.27 12-16V8L16 2z"
            fill="url(#brandGrad)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
        />
        {/* Inner radar ring 1 */}
        <circle cx="16" cy="15" r="7" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
        {/* Inner radar ring 2 */}
        <circle cx="16" cy="15" r="4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" />
        {/* Center dot */}
        <circle cx="16" cy="15" r="1.8" fill="white" />
        {/* Scan line */}
        <path
            d="M16 15L22 9"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        {/* Check tick on shield */}
        <path
            d="M12 22l3 3 6-6"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <defs>
            <linearGradient id="brandGrad" x1="4" y1="2" x2="28" y2="26">
                <stop offset="0%" stopColor="#5865f2" />
                <stop offset="50%" stopColor="#6d79f7" />
                <stop offset="100%" stopColor="#8b94fa" />
            </linearGradient>
        </defs>
    </svg>
);

// ─── Scam Shield Icon ──────────────────────────────────────
// Used for "scam detected" / moderation indicators
export const ScamShieldIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="url(#scamGrad)"
            opacity="0.15"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        {/* Eye / scanner */}
        <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
        {/* Alert triangle bottom */}
        <path d="M10 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
            <linearGradient id="scamGrad" x1="3" y1="2" x2="21" y2="19">
                <stop offset="0%" stopColor="#5865f2" />
                <stop offset="100%" stopColor="#8b94fa" />
            </linearGradient>
        </defs>
    </svg>
);

// ─── Post Verified Icon ────────────────────────────────────
// Shown when a post passes scam check
export const PostVerifiedIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="#5865f2"
            opacity="0.12"
        />
        <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            stroke="#5865f2"
            strokeWidth="1.5"
            fill="none"
        />
        <path
            d="M8.5 12.5l2.5 2.5 5-5"
            stroke="#5865f2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// ─── Aadhaar ID Icon ──────────────────────────────────────
// Fingerprint + card for Aadhaar auth
export const AadhaarIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Card */}
        <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Fingerprint circles */}
        <path d="M12 10a2 2 0 0 1 2 2c0 1.1-.9 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d="M12 8a4 4 0 0 1 4 4c0 2.2-1.8 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d="M12 6a6 6 0 0 1 6 6c0 1.5-.4 2.8-1.1 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="0.8" fill="currentColor" />
        {/* Lines on card */}
        <path d="M5 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5 11h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
);

// ─── Admin Dashboard Icon ──────────────────────────────────
export const DashboardIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
        {/* Status dot */}
        <circle cx="6.5" cy="6.5" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="17.5" cy="14.5" r="1" fill="currentColor" opacity="0.4" />
    </svg>
);

// ─── Content Moderation Icon ────────────────────────────────
export const ModerationIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Document */}
        <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        {/* Lines */}
        <path d="M8 7h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 10.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        {/* Magnifier overlay */}
        <circle cx="15" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M17.5 18.5L20 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// ─── Feed Icon ─────────────────────────────────────────────
export const FeedIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Cards stacked */}
        <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 2h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
        {/* Content lines */}
        <circle cx="8" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M13 9h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M13 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        {/* Bottom bar */}
        <path d="M7 16h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
    </svg>
);

// ─── Create Post Icon ──────────────────────────────────────
export const CreatePostIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// ─── Profile Icon ──────────────────────────────────────────
export const ProfileIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
            d="M4 21c0-3.87 3.58-7 8-7s8 3.13 8 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
        />
    </svg>
);

// ─── Users Group Icon ──────────────────────────────────────
export const UsersGroupIcon = ({ size = 20, className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 20c0-3.31 3.13-6 7-6s7 2.69 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" opacity="0.6" />
        <path d="M19 20c1.7-1.2 3-3.14 3-5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
    </svg>
);
