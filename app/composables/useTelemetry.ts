export function useTelemetry() {
  async function track(eventName: string, payload?: Record<string, any>) {
    try {
      await $fetch('/api/telemetry/event', {
        method: 'POST',
        body: {
          eventName,
          route: window.location.pathname,
          payload: payload || {}
        }
      })
    } catch {
      // best effort only
    }
  }

  return { track }
}
