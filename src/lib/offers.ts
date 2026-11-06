export interface OfferItemInput {
  price: number; // in paise
  quantity: number;
  id?: string;
  name?: string;
}

export interface FreeStickersOfferResult {
  qualifies: boolean;              // true if cart reaches >= Rs 250 threshold
  thresholdPaise: number;          // 25000 paise (Rs 250)
  currentSubtotal: number;         // in paise, full raw subtotal of all items
  amountNeededToUnlock: number;    // in paise, Math.max(0, 25000 - currentSubtotal)
  progressPercent: number;         // 0 to 100
  freeDiscount: number;            // in paise, discount value for up to 5 free stickers
  freeStickersClaimed: number;     // number of free stickers currently added (0 to 5)
  freeStickersRemaining: number;   // 5 - freeStickersClaimed
  maxFreeAllowed: number;          // 5
  freeItemIds: string[];           // IDs of stickers that got discounted as free
}

export const FREE_STICKERS_THRESHOLD_PAISE = 25000; // Rs 250 in paise
export const MAX_FREE_STICKERS = 5;

/**
 * Calculates the "Cart > Rs 250 = Next 5 Stickers Free" offer.
 * When the cart subtotal reaches or crosses Rs 250 (25000 paise),
 * the next 5 stickers added to the cart are 100% free.
 */
export function calculateFreeStickersOffer(
  items: OfferItemInput[]
): FreeStickersOfferResult {
  const thresholdPaise = FREE_STICKERS_THRESHOLD_PAISE;
  const maxFreeAllowed = MAX_FREE_STICKERS;

  // Unpack all cart items into individual units
  const units: { price: number; id: string; name: string }[] = [];
  let totalRawSubtotal = 0;

  for (const item of items) {
    const unitPrice = item.price || 1900;
    const qty = Math.max(0, item.quantity);
    totalRawSubtotal += unitPrice * qty;

    for (let q = 0; q < qty; q++) {
      units.push({
        price: unitPrice,
        id: item.id || `item-${units.length}`,
        name: item.name || "Sticker",
      });
    }
  }

  // Sort descending by price to fairly satisfy the threshold with primary items
  units.sort((a, b) => b.price - a.price);

  let accumulated = 0;
  let thresholdIndex = -1;

  for (let i = 0; i < units.length; i++) {
    accumulated += units[i].price;
    if (accumulated >= thresholdPaise) {
      thresholdIndex = i;
      break;
    }
  }

  // If cart has not reached Rs 250
  if (thresholdIndex === -1) {
    const needed = Math.max(0, thresholdPaise - totalRawSubtotal);
    const progress = Math.min(100, Math.round((totalRawSubtotal / thresholdPaise) * 100));
    return {
      qualifies: false,
      thresholdPaise,
      currentSubtotal: totalRawSubtotal,
      amountNeededToUnlock: needed,
      progressPercent: progress,
      freeDiscount: 0,
      freeStickersClaimed: 0,
      freeStickersRemaining: 0,
      maxFreeAllowed,
      freeItemIds: [],
    };
  }

  // Cart has reached/exceeded Rs 250!
  // Any extra units added beyond thresholdIndex (up to 5) are 100% FREE.
  const extraUnits = units.slice(thresholdIndex + 1);
  const freeUnits = extraUnits.slice(0, maxFreeAllowed);
  const freeDiscount = freeUnits.reduce((acc, u) => acc + u.price, 0);
  const freeStickersClaimed = freeUnits.length;
  const freeStickersRemaining = maxFreeAllowed - freeStickersClaimed;
  const freeItemIds = freeUnits.map(u => u.id);

  return {
    qualifies: true,
    thresholdPaise,
    currentSubtotal: totalRawSubtotal,
    amountNeededToUnlock: 0,
    progressPercent: 100,
    freeDiscount,
    freeStickersClaimed,
    freeStickersRemaining,
    maxFreeAllowed,
    freeItemIds,
  };
}
