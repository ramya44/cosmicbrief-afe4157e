// Meta Conversions API (CAPI) - Server-side event tracking
// Pixel ID: 929280579784427

const PIXEL_ID = "929280579784427";
const API_VERSION = "v21.0";

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID from _fbc cookie
  fbp?: string; // Facebook browser ID from _fbp cookie
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
}

interface EventData {
  eventName: string; // Standard events or custom event names
  eventTime?: number; // Unix timestamp in seconds
  eventSourceUrl?: string;
  userData: UserData;
  customData?: CustomData;
  eventId?: string; // For deduplication with browser pixel
}

/**
 * Hash a value using SHA-256 for Meta CAPI requirements
 */
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Prepare user data with proper hashing
 */
async function prepareUserData(userData: UserData): Promise<Record<string, string>> {
  const prepared: Record<string, string> = {};

  if (userData.email) {
    prepared.em = await hashValue(userData.email);
  }
  if (userData.phone) {
    prepared.ph = await hashValue(userData.phone.replace(/\D/g, ""));
  }
  if (userData.firstName) {
    prepared.fn = await hashValue(userData.firstName);
  }
  if (userData.lastName) {
    prepared.ln = await hashValue(userData.lastName);
  }
  if (userData.city) {
    prepared.ct = await hashValue(userData.city);
  }
  if (userData.state) {
    prepared.st = await hashValue(userData.state);
  }
  if (userData.country) {
    prepared.country = await hashValue(userData.country);
  }
  if (userData.clientIpAddress) {
    prepared.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    prepared.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbc) {
    prepared.fbc = userData.fbc;
  }
  if (userData.fbp) {
    prepared.fbp = userData.fbp;
  }

  return prepared;
}

/**
 * Send an event to Meta Conversions API
 */
export async function trackServerEvent(eventData: EventData): Promise<{ success: boolean; error?: string }> {
  const accessToken = Deno.env.get("META_CAPI_TOKEN");

  if (!accessToken) {
    console.log("[META-CAPI] No access token configured, skipping");
    return { success: false, error: "No access token" };
  }

  try {
    const hashedUserData = await prepareUserData(eventData.userData);

    const event: Record<string, unknown> = {
      event_name: eventData.eventName,
      event_time: eventData.eventTime || Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: hashedUserData,
    };

    if (eventData.eventSourceUrl) {
      event.event_source_url = eventData.eventSourceUrl;
    }

    if (eventData.eventId) {
      event.event_id = eventData.eventId;
    }

    if (eventData.customData) {
      event.custom_data = eventData.customData;
    }

    const payload = {
      data: [event],
    };

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[META-CAPI] Error:", result);
      return { success: false, error: result.error?.message || "API error" };
    }

    console.log("[META-CAPI] Event sent:", eventData.eventName, result);
    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[META-CAPI] Exception:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Track a Lead event (free forecast generated)
 */
export async function trackLead(params: {
  email?: string;
  name?: string;
  clientIp?: string;
  userAgent?: string;
  sourceUrl?: string;
  eventId?: string; // For deduplication with browser pixel
}): Promise<void> {
  const nameParts = params.name?.split(" ") || [];

  const userData = {
    email: params.email,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || undefined,
    clientIpAddress: params.clientIp,
    clientUserAgent: params.userAgent,
  };

  const customData = {
    content_name: "free_vedic_forecast",
    content_category: "astrology",
  };

  // Send standard Lead event (for Meta optimization)
  await trackServerEvent({
    eventName: "Lead",
    eventSourceUrl: params.sourceUrl || "https://cosmicbrief.com/#/vedic/input",
    eventId: params.eventId,
    userData,
    customData,
  });

  // Send custom named event (for clear dashboard visibility)
  await trackServerEvent({
    eventName: "FreeForecastGenerated",
    eventSourceUrl: params.sourceUrl || "https://cosmicbrief.com/#/vedic/input",
    eventId: params.eventId ? `${params.eventId}_custom` : undefined,
    userData,
    customData,
  });
}

/**
 * Track a Purchase event (paid forecast)
 */
export async function trackPurchase(params: {
  email?: string;
  name?: string;
  value: number;
  currency: string;
  clientIp?: string;
  userAgent?: string;
  sourceUrl?: string;
  transactionId?: string;
}): Promise<void> {
  const nameParts = params.name?.split(" ") || [];

  const userData = {
    email: params.email,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || undefined,
    clientIpAddress: params.clientIp,
    clientUserAgent: params.userAgent,
  };

  const customData = {
    value: params.value,
    currency: params.currency,
    content_name: "paid_vedic_forecast",
    content_category: "astrology",
  };

  // Send standard Purchase event (for Meta optimization)
  await trackServerEvent({
    eventName: "Purchase",
    eventSourceUrl: params.sourceUrl || "https://cosmicbrief.com/#/vedic/payment-success",
    eventId: params.transactionId,
    userData,
    customData,
  });

  // Send custom named event (for clear dashboard visibility)
  await trackServerEvent({
    eventName: "PaidForecastPurchased",
    eventSourceUrl: params.sourceUrl || "https://cosmicbrief.com/#/vedic/payment-success",
    eventId: params.transactionId ? `${params.transactionId}_custom` : undefined,
    userData,
    customData,
  });
}
