/** The fixed set of reactions friends can leave on a post. */
export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '🔥', '👏'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

/** Aggregated reactions for one post, from the perspective of a viewer. */
export interface ReactionSummary {
  emoji: string;
  count: number;
  reacted: boolean; // true if the viewer themselves used this emoji
}
