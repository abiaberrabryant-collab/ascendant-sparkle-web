/**
 * Buyer-intent classification for Signal Studio.
 *
 * Distinguishes people ASKING FOR a service (real leads) from people OFFERING
 * one (competitors/ads) or from unrelated news. This is what stops the studio
 * from surfacing sellers instead of buyers.
 */

// Language a person uses when they WANT a service.
const BUYER_PATTERNS: RegExp[] = [
  /\blooking for\b/,
  /\bin need of\b/,
  /\bneed (a|an|some|help|to hire|to find)\b/,
  /\b(searching|search) for\b/,
  /\bin search of\b/,
  /\biso\b/,
  /\brecommend(ations?)?\b/,
  /\banyone (know|recommend|have|use|used)\b/,
  /\bcan anyone\b/,
  /\bwho (can|should|do you|would you)\b/,
  /\bhelp me (find|choose|hire)\b/,
  /\btrying to find\b/,
  /\bwhere (can|do) i (get|find|hire|buy)\b/,
  /\bsuggestions? for\b/,
  /\badvice on (hiring|finding|choosing)\b/,
  /\b(quote|estimate|pricing) for\b/,
  /\bhire (a|an|someone|somebody)\b/,
  /\bany recommendations\b/,
  /\bneed someone to\b/,
  /\bcan someone (help|recommend)\b/,
];

// Language a person uses when they are SELLING / promoting a service.
const SELLER_PATTERNS: RegExp[] = [
  /\bwe (offer|provide|specialize|are a|do|serve|deliver|install|repair)\b/,
  /\bour (services|team|company|clients|work)\b/,
  /\bhire us\b/,
  /\bcall (us|now|today)\b/,
  /\bbook (now|today|online)\b/,
  /\bdm me\b/,
  /\bmessage me\b/,
  /\bfor hire\b/,
  /\bservices offered\b/,
  /\bfree (quote|estimate|consultation)!?\b/,
  /\b\d+% off\b/,
  /\bnow hiring\b/,
  /\bwe'?re hiring\b/,
  /\bgrand opening\b/,
  /\bcheck out (my|our)\b/,
  /\bvisit (my|our) (site|website|page|shop)\b/,
  /\bcontact us (today|now)\b/,
  /\blicensed and insured\b/,
  /\bbest (prices|rates) (in|around)\b/,
  /\bcall for a free\b/,
  /\b(we|i) (build|create|design|make|develop) (websites|sites|web)\b/,
  /\b(web|website) (design|development) (services|company|agency|studio|solutions)\b/,
  /\bget (a|your) (free )?quote\b/,
  /\bstarting (at|from) \$?\d+/,
  /\bavailable for (work|hire|projects|freelance)\b/,
  /\bfreelance (web|website|designer|developer|dev)\b/,
  /\bview (my|our) portfolio\b/,
  /\bfollow (me|us) (on|for)\b/,
  /\bpromo(tion)?\b/,
  /\bsubscribe\b/,
  /\bwe can help you\b/,
];

export type IntentResult = { isBuyer: boolean; isSeller: boolean; intentHits: string[] };

/** Classifies a piece of text as buyer intent, seller/promotional, or neither. */
export function scoreBuyerIntent(text: string): IntentResult {
  const lower = text.toLowerCase();
  const intentHits: string[] = [];
  for (const pattern of BUYER_PATTERNS) {
    const match = lower.match(pattern);
    if (match) intentHits.push(match[0].trim());
  }
  const isSeller = SELLER_PATTERNS.some((pattern) => pattern.test(lower));
  return { isBuyer: intentHits.length > 0, isSeller, intentHits: [...new Set(intentHits)] };
}
