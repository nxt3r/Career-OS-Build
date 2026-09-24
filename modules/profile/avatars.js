export const AVATAR_EMOJIS = [
  "🦊", "🐺", "🦁", "🐯", "🐼",
  "🐨", "🦉", "🐸", "🐙", "🦄",
  "🐲", "🦅", "🐬", "🦈", "🐝"
];

export const AVATAR_COLORS = [
  "#3B82F6", "#A855F7", "#EF4444",
  "#F97316", "#22C55E", "#EAB308",
  "#EC4899", "#14B8A6"
];

export function getAvatarDisplay(profile) {

  if (profile?.avatarUrl) {

    return {
      type: "image",
      url: profile.avatarUrl,
      emoji: profile?.avatarEmoji || AVATAR_EMOJIS[0],
      color: profile?.avatarColor || AVATAR_COLORS[0]
    };

  }

  return {
    type: "emoji",
    emoji: profile?.avatarEmoji || AVATAR_EMOJIS[0],
    color: profile?.avatarColor || AVATAR_COLORS[0]
  };

}