export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Could be an emoji, an SVG string, or a classname for an icon
}

export const BADGES: Record<string, Badge> = {
  "FIRST_MARK": {
    id: "FIRST_MARK",
    name: "First Mark",
    description: "Placed first order",
    icon: "1️⃣",
  },
  "BOOT_OWNER": {
    id: "BOOT_OWNER",
    name: "Boot Owner",
    description: "Bought any BOOT drop sticker",
    icon: "🥾",
  },
  "SIGNAL_SENT": {
    id: "SIGNAL_SENT",
    name: "Signal Sent",
    description: "Bought 10+ stickers total",
    icon: "📡",
  },
  "GRID_WALKER": {
    id: "GRID_WALKER",
    name: "Grid Walker",
    description: "Reached GRID tier",
    icon: "🔲",
  },
  "THE_MARK": {
    id: "THE_MARK",
    name: "The Mark",
    description: "Reached MARK tier",
    icon: "⚫",
  },
  "SHADOW_FOUND": {
    id: "SHADOW_FOUND",
    name: "Shadow Found",
    description: "Unlocked secret section",
    icon: "👁️",
  },
  "CUSTOM_CRAFTED": {
    id: "CUSTOM_CRAFTED",
    name: "Custom Crafted",
    description: "Submitted a custom sticker",
    icon: "✂️",
  },
  "EARLY_SIGNAL": {
    id: "EARLY_SIGNAL",
    name: "Early Signal",
    description: "Joined before Drop 001 launch",
    icon: "⏳",
  },
  "CENT_CLUB": {
    id: "CENT_CLUB",
    name: "Cent Club",
    description: "Bought 100+ stickers",
    icon: "💯",
  },
  "FULL_SURFACE": {
    id: "FULL_SURFACE",
    name: "Full Surface",
    description: "Bought 250+ stickers",
    icon: "🌌",
  },
  "DROP_CHASER": {
    id: "DROP_CHASER",
    name: "Drop Chaser",
    description: "Ordered in first 24hrs of any drop",
    icon: "⚡",
  },
  "STICKER_SPREAD": {
    id: "STICKER_SPREAD",
    name: "Sticker Spread",
    description: "Tagged @dott.drop on Instagram",
    icon: "📸",
  },
  "SILENT_MARK": {
    id: "SILENT_MARK",
    name: "Silent Mark",
    description: "Never missed a drop",
    icon: "🤫",
  },
  "ORIGIN": {
    id: "ORIGIN",
    name: "Origin",
    description: "Gen 1 member (first 100 users)",
    icon: "👑",
  }
};
