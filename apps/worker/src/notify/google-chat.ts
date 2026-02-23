/**
 * Google Chat Notification Handler for Uptimer
 *
 * Builds Google Chat Card v2 messages with 3MW branding,
 * proper formatting, and rich status information.
 */

import type { NotificationEventType } from '@uptimer/db';

/**
 * 3MW Branding Configuration
 */
const BRANDING = {
  logoUrl: 'https://www.3mediaweb.com/wp-content/themes/3mediaweb2021/assets/fav/apple-touch-icon.png',
  companyName: '3 Media Web',
  signature: '— Your friendly Uptime Monitoring Bot',
};

/**
 * Format Unix timestamp to human-readable date/time
 *
 * @param timestamp - Unix timestamp in seconds
 * @param timezone - IANA timezone (e.g., 'America/New_York')
 * @returns Formatted date string (e.g., "Feb 23, 2026 11:59 PM EST")
 */
function formatTimestamp(timestamp: number, timezone: string = 'America/New_York'): string {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  };

  return date.toLocaleString('en-US', options);
}

/**
 * Format downtime duration as human-readable string
 *
 * @param durationSeconds - Duration in seconds
 * @returns Formatted duration (e.g., "2m 34s", "1h 15m", "3d 2h")
 */
function formatDuration(durationSeconds: number): string {
  if (durationSeconds < 60) {
    return `${durationSeconds}s`;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Capitalize first letter of string
 *
 * @param str - String to capitalize
 * @returns Capitalized string (e.g., "up" → "Up", "down" → "Down")
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Build Google Chat Card v2 message for monitor DOWN event
 */
export function buildMonitorDownCard(payload: {
  monitor: {
    name: string;
    target: string;
  };
  state: {
    status: string;
    error?: string;
  };
  timestamp: number;
  timezone?: string;
}): object {
  const formattedTime = formatTimestamp(payload.timestamp, payload.timezone);
  const status = capitalize(payload.state.status);

  return {
    cardsV2: [
      {
        cardId: `uptimer-down-${payload.timestamp}`,
        card: {
          header: {
            title: '🔴 Website Down Alert',
            subtitle: payload.monitor.name,
            imageUrl: BRANDING.logoUrl,
            imageStyle: 'IMAGE',
          },
          sections: [
            {
              widgets: [
                {
                  decoratedText: {
                    topLabel: 'Website',
                    text: `<b>${payload.monitor.target}</b>`,
                    startIcon: {
                      knownIcon: 'DESCRIPTION',
                    },
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'Status',
                    text: `<b>${status}</b>`,
                    startIcon: {
                      knownIcon: 'BOOKMARK',
                    },
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'Time Detected',
                    text: formattedTime,
                    startIcon: {
                      knownIcon: 'CLOCK',
                    },
                  },
                },
                ...(payload.state.error
                  ? [
                      {
                        decoratedText: {
                          topLabel: 'Error',
                          text: payload.state.error,
                          startIcon: {
                            knownIcon: 'STAR',
                          },
                        },
                      },
                    ]
                  : []),
                {
                  textParagraph: {
                    text: `<font color="#888888"><i>${BRANDING.signature}</i></font>`,
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Build Google Chat Card v2 message for monitor UP event
 */
export function buildMonitorUpCard(payload: {
  monitor: {
    name: string;
    target: string;
  };
  state: {
    status: string;
  };
  timestamp: number;
  downtimeDuration?: number; // Duration in seconds
  timezone?: string;
}): object {
  const formattedTime = formatTimestamp(payload.timestamp, payload.timezone);
  const status = capitalize(payload.state.status);

  return {
    cardsV2: [
      {
        cardId: `uptimer-up-${payload.timestamp}`,
        card: {
          header: {
            title: '✅ Website Recovered',
            subtitle: payload.monitor.name,
            imageUrl: BRANDING.logoUrl,
            imageStyle: 'IMAGE',
          },
          sections: [
            {
              widgets: [
                {
                  decoratedText: {
                    topLabel: 'Website',
                    text: `<b>${payload.monitor.target}</b>`,
                    startIcon: {
                      knownIcon: 'DESCRIPTION',
                    },
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'Status',
                    text: `<b>${status}</b>`,
                    startIcon: {
                      knownIcon: 'BOOKMARK',
                    },
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'Recovered At',
                    text: formattedTime,
                    startIcon: {
                      knownIcon: 'CLOCK',
                    },
                  },
                },
                ...(payload.downtimeDuration
                  ? [
                      {
                        decoratedText: {
                          topLabel: 'Downtime Duration',
                          text: `<b>${formatDuration(payload.downtimeDuration)}</b>`,
                          startIcon: {
                            knownIcon: 'STAR',
                          },
                        },
                      },
                    ]
                  : []),
                {
                  textParagraph: {
                    text: `<font color="#888888"><i>${BRANDING.signature}</i></font>`,
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Build Google Chat Card v2 message for test.ping event
 */
export function buildTestPingCard(payload: {
  channelName: string;
  timestamp: number;
  timezone?: string;
}): object {
  const formattedTime = formatTimestamp(payload.timestamp, payload.timezone);

  return {
    cardsV2: [
      {
        cardId: `uptimer-test-${payload.timestamp}`,
        card: {
          header: {
            title: 'Test Notification',
            subtitle: 'Uptimer Monitoring System',
            imageUrl: BRANDING.logoUrl,
            imageStyle: 'IMAGE',
          },
          sections: [
            {
              widgets: [
                {
                  textParagraph: {
                    text: `This is a test notification from <b>${payload.channelName}</b>.`,
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'Test Time',
                    text: formattedTime,
                    startIcon: {
                      knownIcon: 'CLOCK',
                    },
                  },
                },
                {
                  textParagraph: {
                    text: '<font color="#888888"><i>If you see this message, your Google Chat integration is working correctly!</i></font>',
                  },
                },
                {
                  textParagraph: {
                    text: `<font color="#888888"><i>${BRANDING.signature}</i></font>`,
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Main router: Build appropriate card based on event type
 */
export function buildGoogleChatCard(
  eventType: NotificationEventType | string,
  payload: any,
  timezone?: string,
): object {
  const enhancedPayload = { ...payload, timezone };

  switch (eventType) {
    case 'monitor.down':
      return buildMonitorDownCard(enhancedPayload);

    case 'monitor.up':
      return buildMonitorUpCard(enhancedPayload);

    case 'test.ping':
      return buildTestPingCard({
        channelName: payload.channel?.name || 'Google Chat',
        timestamp: payload.timestamp || Math.floor(Date.now() / 1000),
        timezone,
      });

    default:
      // Fallback for unknown events
      return {
        text: `Uptimer event: ${eventType}`,
      };
  }
}

/**
 * Send card to Google Chat webhook
 */
export async function sendToGoogleChat(
  webhookUrl: string,
  eventType: NotificationEventType | string,
  payload: any,
  timezone?: string,
): Promise<{ success: boolean; httpStatus: number; error?: string }> {
  try {
    const card = buildGoogleChatCard(eventType, payload, timezone);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });

    if (response.ok) {
      return { success: true, httpStatus: response.status };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        httpStatus: response.status,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      httpStatus: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
