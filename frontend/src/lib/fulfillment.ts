type SettingsLike = {
  DELIVERY_ENABLED?: number | boolean | null;
  PICKUP_ENABLED?: number | boolean | null;
  PICKUP_INSTRUCTIONS?: string | null;
  DEFAULT_PICKUP_PREP_MINUTES?: number | null;
  DEFAULT_DELIVERY_PREP_MINUTES?: number | null;
  DELIVERY_ZONES_JSON?: string | null;
  DELIVERY_RANGE_ZIP_CODES?: string | null;
};

type ZoneLike = {
  name?: string;
  zoneName?: string;
  postalCodes?: unknown;
  zipCodes?: unknown;
  zips?: unknown;
  postalCode?: unknown;
  zip?: unknown;
  deliveryPrice?: unknown;
  price?: unknown;
  fee?: unknown;
  minimumOrder?: unknown;
  minimumOrderAmount?: unknown;
  minOrder?: unknown;
  freeDeliveryAbove?: unknown;
  deliveryInformation?: string;
  information?: string;
};

export type DeliveryZoneDisplay = {
  zoneName: string;
  postalCodes: string[];
  minimumOrderPrice: number;
  deliveryPrice: number;
  freeDeliveryAbove: number;
  deliveryInformation?: string;
};

export type DeliveryQuote = {
  available: boolean;
  reason?: string;
  zoneName?: string;
  deliveryPrice: number;
  freeDeliveryApplied: boolean;
  deliveryInformation?: string;
};

const enabled = (value: number | boolean | null | undefined, fallback = false) =>
  value == null ? fallback : value === true || value === 1;

const money = (value: unknown) => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const list = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String)
    : String(value ?? "")
        .split(/[,\s]+/)
        .filter(Boolean);

export const getFulfillmentOptions = (settings?: SettingsLike | null) => ({
  deliveryEnabled: enabled(settings?.DELIVERY_ENABLED, true),
  pickupEnabled: enabled(settings?.PICKUP_ENABLED),
  pickupInstructions: settings?.PICKUP_INSTRUCTIONS ?? "",
  defaultPickupPrepMinutes: settings?.DEFAULT_PICKUP_PREP_MINUTES ?? 20,
  defaultDeliveryPrepMinutes: settings?.DEFAULT_DELIVERY_PREP_MINUTES ?? 45,
});

const zonesFromSettings = (settings?: SettingsLike | null): ZoneLike[] => {
  if (!settings?.DELIVERY_ZONES_JSON) {
    return settings?.DELIVERY_RANGE_ZIP_CODES
      ? [{ name: "Delivery area", zipCodes: settings.DELIVERY_RANGE_ZIP_CODES }]
      : [];
  }

  try {
    const parsed = JSON.parse(settings.DELIVERY_ZONES_JSON);
    return Array.isArray(parsed) ? parsed : parsed.zones ?? parsed.deliveryZones ?? [];
  } catch {
    return [];
  }
};

export const getDeliveryZonesDisplay = (settings?: SettingsLike | null): DeliveryZoneDisplay[] =>
  zonesFromSettings(settings).map((zone, index) => ({
    zoneName: zone.name ?? zone.zoneName ?? `Zone ${index + 1}`,
    postalCodes: list(zone.postalCodes ?? zone.zipCodes ?? zone.zips ?? zone.postalCode ?? zone.zip),
    minimumOrderPrice: money(zone.minimumOrder ?? zone.minimumOrderAmount ?? zone.minOrder),
    deliveryPrice: money(zone.deliveryPrice ?? zone.price ?? zone.fee),
    freeDeliveryAbove: money(zone.freeDeliveryAbove),
    deliveryInformation: zone.deliveryInformation ?? zone.information,
  }));

export const getDeliveryQuote = (
  settings: SettingsLike | null | undefined,
  postalCode: string,
  cartTotal: number
): DeliveryQuote => {
  if (!enabled(settings?.DELIVERY_ENABLED, true)) {
    return { available: false, reason: "Delivery is currently unavailable.", deliveryPrice: 0, freeDeliveryApplied: false };
  }

  const cleanPostalCode = postalCode.trim();
  const zone = zonesFromSettings(settings).find((candidate) =>
    list(candidate.postalCodes ?? candidate.zipCodes ?? candidate.zips ?? candidate.postalCode ?? candidate.zip)
      .includes(cleanPostalCode)
  );

  if (!zone) {
    return { available: false, reason: "Delivery is not available for this postal code.", deliveryPrice: 0, freeDeliveryApplied: false };
  }

  const minimumOrder = money(zone.minimumOrder ?? zone.minimumOrderAmount ?? zone.minOrder);
  if (cartTotal < minimumOrder) {
    return {
      available: false,
      reason: `Minimum order for this delivery area is CHF ${minimumOrder.toFixed(2)}.`,
      zoneName: zone.name ?? zone.zoneName,
      deliveryPrice: 0,
      freeDeliveryApplied: false,
      deliveryInformation: zone.deliveryInformation ?? zone.information,
    };
  }

  const freeDeliveryAbove = money(zone.freeDeliveryAbove);
  const freeDeliveryApplied = freeDeliveryAbove > 0 && cartTotal >= freeDeliveryAbove;

  return {
    available: true,
    zoneName: zone.name ?? zone.zoneName,
    deliveryPrice: freeDeliveryApplied ? 0 : money(zone.deliveryPrice ?? zone.price ?? zone.fee),
    freeDeliveryApplied,
    deliveryInformation: zone.deliveryInformation ?? zone.information,
  };
};
