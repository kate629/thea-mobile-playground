const INTEREST_LOADING_COPY: Record<string, string> = {
  accessories: 'Pulling together polished finishing touches',
  alcohol: 'Looking up top-rated gifts for the home bar pro',
  baking: 'Finding crowd-pleasing picks for the baker',
  beauty: 'Curating elevated self-care favorites',
  books: 'Turning up thoughtful finds for the book lover',
  cats: 'Spotlighting clever gifts for the cat person',
  clothes: 'Pulling stylish wardrobe favorites',
  clothing: 'Pulling stylish wardrobe favorites',
  coffee: 'Brewing up standout coffee favorites',
  cooking: 'Finding kitchen picks worth reaching for',
  crafts: 'Uncovering creative favorites for hands-on makers',
  decor: 'Uncovering home decor favorites',
  dogs: 'Digging up great gifts for the dog lover',
  experiences: 'Hunting for memorable experience gifts',
  fitness: 'Finding top-rated picks for the fitness regular',
  games: 'Rounding up game night standouts',
  hosting: 'Finding standout picks for a great host',
  homedecor: 'Uncovering home decor favorites',
  jewelry: 'Searching for pieces with a little sparkle',
  music: 'Queuing up gifts for the music lover',
  outdoors: 'Exploring favorites for the outdoorsy one',
  plants: 'Digging into plant-loving favorites',
  sports: 'Looking for winning finds for the sports fan',
  sweets: 'Tracking down sweet little indulgences',
  tea: 'Steeping on thoughtful tea-time favorites',
  travel: 'Finding carry-on-worthy travel picks',
};

const RELATIONSHIP_PLURAL: Record<string, string> = {
  Mom: 'moms',
  Dad: 'dads',
  Partner: 'partners',
  Sister: 'sisters',
  Brother: 'brothers',
  Friend: 'friends',
  Daughter: 'daughters',
  Son: 'sons',
  Grandma: 'grandmas',
  Grandpa: 'grandpas',
  Granddaughter: 'granddaughters',
  Grandson: 'grandsons',
};

const GENERIC_FALLBACK_MESSAGES = [
  'Pulling the latest trending favorites',
  'Finding gifts so good you may want to keep them yourself',
  'Shortlisting the good stuff',
  'Gathering ideas worth a second look',
];

/**
 * Builds the rotating typewriter message list shown during /loading. Order:
 *   1. Interest-specific lines (in pick order)
 *   2. Relationship-plural sentence (skipped for Other / Me! / missing)
 *   3. Cheeky generic fallbacks
 *
 * Always returns at least the fallbacks, so the typewriter never starves.
 */
export function buildLoadingMessages(interests: string[] = [], relationship?: string): string[] {
  const messages: string[] = [];

  const deduped = Array.from(new Set(interests.map((i) => i.trim()).filter(Boolean)));
  const mapped = deduped
    .map((i) => INTEREST_LOADING_COPY[i.toLowerCase()])
    .filter((m): m is string => Boolean(m));
  if (mapped.length > 0) {
    messages.push(...mapped);
  } else if (deduped.length > 0) {
    messages.push(...deduped.map((i) => `Curating thoughtful favorites for ${i.toLowerCase()}`));
  }

  const plural = relationship ? RELATIONSHIP_PLURAL[relationship] : undefined;
  if (plural) {
    messages.push(`Rounding up gifts that ${plural} love`);
  }

  messages.push(...GENERIC_FALLBACK_MESSAGES);

  return messages;
}
