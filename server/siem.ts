import axios from "axios";

/**
 * SIEM Export Utility (Splunk / QRadar / Webhook)
 */

interface SIEMEvent {
  event: string;
  user?: string;
  ip?: string;
  details?: any;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  timestamp: string;
}

const SIEM_WEBHOOK_URL = process.env.SIEM_WEBHOOK_URL;
const SIEM_PROVIDER = process.env.SIEM_PROVIDER || "generic";

/**
 * Logs an event to the configured SIEM provider.
 */
export async function logToSIEM(eventData: Omit<SIEMEvent, "timestamp">) {
  const event: SIEMEvent = {
    ...eventData,
    timestamp: new Date().toISOString()
  };

  // Always log to console for debugging
  console.log(`[SIEM:${SIEM_PROVIDER}]`, JSON.stringify(event));

  if (!SIEM_WEBHOOK_URL) {
    return;
  }

  try {
    // Send to external SIEM
    await axios.post(SIEM_WEBHOOK_URL, event, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Redroom-Event": event.event
      }
    });
  } catch (error) {
    console.error(`[SIEM] Failed to forward event to ${SIEM_PROVIDER}:`, (error as Error).message);
  }
}
