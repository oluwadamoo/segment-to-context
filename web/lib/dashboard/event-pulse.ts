export type EventStreamItem = {
  id: string;
  userId: string;
  eventType: string;
  product: string;
  category: string;
  channel: string;
  brand: string;
  price: number;
  timestamp: string;
  payload: Record<string, unknown>;
  animationMode?: "live" | "buffered";
  animationIndex?: number;
};

export type EventIngestedMessage = {
  type: "event.ingested";
  tenantId: string;
  event: {
    id: string;
    userId: string;
    eventType: string;
    payload: Record<string, unknown>;
    timestamp: string;
  };
};

export type UserPersona = {
  userId: string;
  archetype: string;
  confidence: number;
  summary: string;
  dominantCategory: string;
  interests: string[];
  recommendedAction: string;
  eventCount: number;
  averageSpend: number;
  lastAnalyzed: string;
  primaryChannel: string;
};

const eventBlueprints = [
  {
    eventType: "view",
    product: "Apple Wristwatch",
    category: "electronics.wearables",
    channel: "web",
    brand: "Apple",
    price: 162.01,
  },
  {
    eventType: "add_to_cart",
    product: "Samsung Galaxy Buds",
    category: "electronics.audio",
    channel: "mobile",
    brand: "Samsung",
    price: 109.5,
  },
  {
    eventType: "checkout_started",
    product: "Sony WH-1000XM5",
    category: "electronics.audio",
    channel: "web",
    brand: "Sony",
    price: 329.99,
  },
  {
    eventType: "view",
    product: "Nike Zoom Pegasus",
    category: "fashion.sneakers",
    channel: "web",
    brand: "Nike",
    price: 145.0,
  },
  {
    eventType: "purchase",
    product: "Kindle Paperwhite",
    category: "electronics.readers",
    channel: "mobile",
    brand: "Amazon",
    price: 189.99,
  },
];

export function createSeedEvents(): EventStreamItem[] {
  return Array.from({ length: 10 }, (_, index) =>
    createMockEvent(index * 17, Date.now() - index * 70_000)
  );
}

export function createMockEvent(seed = 0, timestamp = Date.now()): EventStreamItem {
  const blueprint = eventBlueprints[seed % eventBlueprints.length];

  return {
    id: `evt_${timestamp}_${seed}`,
    userId: `${(seed % 6) + 1}`,
    eventType: blueprint.eventType,
    product: blueprint.product,
    category: blueprint.category,
    channel: blueprint.channel,
    brand: blueprint.brand,
    price: Number((blueprint.price + (seed % 4) * 3.25).toFixed(2)),
    timestamp: new Date(timestamp).toISOString(),
    payload: {
      product: blueprint.product,
      category: blueprint.category,
      channel: blueprint.channel,
      brand: blueprint.brand,
      price: Number((blueprint.price + (seed % 4) * 3.25).toFixed(2)),
    },
  };
}

export function derivePersona(events: EventStreamItem[]) {
  const recentEvents = events.slice(0, 8);
  const averagePrice =
    recentEvents.reduce((total, event) => total + event.price, 0) /
    Math.max(recentEvents.length, 1);

  const dominantCategory = recentEvents[0]?.category ?? "electronics.general";
  const prefersMobile =
    recentEvents.filter((event) => event.channel === "mobile").length >=
    Math.ceil(recentEvents.length / 2);

  return {
    archetype:
      averagePrice > 180
        ? "High-intent premium shopper"
        : "Active comparison shopper",
    confidence: averagePrice > 180 ? 92 : 84,
    summary: prefersMobile
      ? "Sessions skew mobile-first with quick progression toward transactional actions."
      : "The stream suggests a research-heavy buyer who converts after repeated product exposure.",
    dominantCategory,
    recommendedAction:
      averagePrice > 180
        ? "Surface premium bundles and limited-time checkout nudges."
        : "Reinforce trust with reviews, warranty messaging, and cart recovery prompts.",
  };
}

export function deriveUserPersona(
  events: EventStreamItem[],
  userId: string
): UserPersona | null {
  const userEvents = events
    .filter((event) => event.userId === userId)
    .sort((left, right) => +new Date(right.timestamp) - +new Date(left.timestamp));

  if (userEvents.length === 0) {
    return null;
  }

  const averageSpend =
    userEvents.reduce((total, event) => total + event.price, 0) / userEvents.length;
  const lastAnalyzed = userEvents[0]?.timestamp ?? new Date().toISOString();

  const categoryCounts = countValues(userEvents.map((event) => event.category));
  const channelCounts = countValues(userEvents.map((event) => event.channel));
  const interestPool = [
    ...userEvents.map((event) => event.category),
    ...userEvents.map((event) => event.brand),
    ...userEvents.map((event) => event.product),
  ];

  const interests = Object.entries(countValues(interestPool))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([value]) => value);

  const purchaseCount = userEvents.filter((event) => event.eventType === "purchase").length;
  const cartCount = userEvents.filter((event) => event.eventType === "add_to_cart").length;
  const dominantCategory = getTopKey(categoryCounts) ?? "electronics.general";
  const primaryChannel = getTopKey(channelCounts) ?? "web";

  let archetype = "Research-heavy browser";
  let recommendedAction =
    "Keep educational content, reviews, and reassurance visible across the journey.";
  let summary =
    "This user is exploring repeatedly and building intent through multiple touches before committing.";

  if (purchaseCount > 0 || averageSpend > 220) {
    archetype = "High-intent premium shopper";
    recommendedAction =
      "Promote premium bundles, warranty upgrades, and urgency-based conversion nudges.";
    summary =
      "Recent events suggest decisive purchase behavior with above-average spend and low hesitation.";
  } else if (cartCount > 0) {
    archetype = "Cart-ready comparison shopper";
    recommendedAction =
      "Use trust signals, limited incentives, and streamlined checkout prompts to close the sale.";
    summary =
      "This user has moved beyond browsing and is showing clear commercial intent with cart activity.";
  }

  const confidence = Math.min(
    97,
    68 + userEvents.length * 4 + purchaseCount * 7 + cartCount * 5
  );

  return {
    userId,
    archetype,
    confidence,
    summary,
    dominantCategory,
    interests,
    recommendedAction,
    eventCount: userEvents.length,
    averageSpend: Number(averageSpend.toFixed(2)),
    lastAnalyzed,
    primaryChannel,
  };
}

export function mapStreamMessageToEventStreamItem(
  message: EventIngestedMessage
): EventStreamItem {
  const payload = message.event.payload;

  return {
    id: message.event.id,
    userId: message.event.userId,
    eventType: message.event.eventType,
    product: readString(payload.product, "Unknown product"),
    category: readString(payload.category, "uncategorized"),
    channel: readString(payload.channel, readString(payload.browser, "unknown")),
    brand: readString(payload.brand, "Unknown brand"),
    price: readNumber(payload.price, 0),
    timestamp: message.event.timestamp,
    payload,
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function countValues(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function getTopKey(counts: Record<string, number>) {
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}
