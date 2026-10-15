
import { getDepartures } from './transitous.js';

export const TRANSITOUS_DEPARTURES_WIDGET = 'transitous_departures';

const text = (value, variant = 'body') => ({
  type: 'text',
  variant,
  text: value,
});

function shortText(value, maxLength) {
  const result = String(value ?? '').trim();
  if (result.length <= maxLength) return result;
  return `${result.slice(0, maxLength - 1)}…`;
}

function stopSummary(stops) {
  if (!stops.length) return 'Keine Haltestelle gefunden';

  return shortText(
    stops.map((stop) => `${stop.category} ${stop.distanceMeters} m`).join(' · '),
    80,
  );
}

export const WIDGETS = {
  [TRANSITOUS_DEPARTURES_WIDGET]: {
    async get(gladys, { settings = {} }) {
      const latitude = Number(settings.latitude);
      const longitude = Number(settings.longitude);
      const radius = Number(settings.radius ?? 2000);
      const count = Number(settings.count ?? 5);
      const refreshMinutes = Number(settings.refresh_minutes ?? 30);

      const ttlSeconds = Math.min(3600, Math.max(600, refreshMinutes * 60));

      const components = [text('ÖPNV-Abfahrten in der Nähe', 'heading')];

      if (
        settings.latitude === undefined ||
        settings.longitude === undefined ||
        settings.latitude === '' ||
        settings.longitude === '' ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        components.push(
          text(
            'Bitte öffne die Widget-Einstellungen und trage Breitengrad und Längengrad ein.',
          ),
        );

        return { ttl_seconds: ttlSeconds, components };
      }

      try {
        const result = await getDepartures({
          lat: latitude,
          lon: longitude,
          radius,
          count,
          contact: settings.contact || undefined,
        });

        components.push(text(stopSummary(result.stopsSelected), 'caption'));

        if (!result.departures.length) {
          components.push(
            text('Im gewählten Umkreis wurden keine Abfahrten gefunden.'),
          );
          return { ttl_seconds: ttlSeconds, components };
        }

        components.push(
          ...result.departures.slice(0, 6).map((departure) => {
            const line = departure.line || departure.displayedMode;

            const lineColor = {
              BUS: 'success',
              ODM: 'success',
              TRAM: 'warning',
              SUBWAY: 'warning',
              RAIL: 'info',
              REGIONAL_RAIL: 'info',
              REGIONAL_FAST_RAIL: 'info',
              SUBURBAN: 'info',
              HIGHSPEED_RAIL: 'info',
              HIGH_SPEED_RAIL: 'info',
              LONG_DISTANCE: 'info',
              NIGHT_RAIL: 'info',
            }[departure.mode] || 'primary';

            const cancelled = departure.status === 'CANCELLED';

            const stopName = departure.stopName || 'Unbekannte Haltestelle';

            return {
                type: 'value',
                value: shortText(
                      `${departure.time ?? '--:--'} · ${line}`,
                      24,
                  ),
label: (() => {
  const stop = stopName || 'Unbekannte Haltestelle';
  const destination = departure.destination || 'Ziel unbekannt';
  const maxLength = 24;
  const separator = '»';

  const destinationText = destination.slice(
    0,
    Math.min(destination.length, 16),
  );
  const stopLength = Math.max(
    0,
    maxLength - destinationText.length - separator.length,
  );

  return `${stop.slice(0, stopLength)}${separator}${destinationText}`;
})(),
                icon: ({
                  BUS: 'bus',
                  ODM: 'bus',
                  FERRY: 'ship',
                  FUNICULAR: 'maximize-2',
                  TRAM: 'monitor',
                  SUBWAY: 'monitor',
                  RAIL: 'monitor',
                  REGIONAL_RAIL: 'monitor',
                  REGIONAL_FAST_RAIL: 'monitor',
                  SUBURBAN: 'monitor',
                  HIGHSPEED_RAIL: 'monitor',
                  HIGH_SPEED_RAIL: 'monitor',
                  LONG_DISTANCE: 'monitor',
                  NIGHT_RAIL: 'monitor',
                })[departure.mode] || 'bus',
                color: cancelled ? 'danger' : lineColor,
            };
          }),
        );

        return { ttl_seconds: ttlSeconds, components };
      } catch {
        components.push(
          text(
            'Die Abfahrten konnten gerade nicht geladen werden. Bitte später erneut versuchen.',
          ),
        );

        return { ttl_seconds: ttlSeconds, components };
      }
    },
  },
};

export function refreshWidgets(gladys) {
  for (const key of Object.keys(WIDGETS)) {
    gladys.requestWidgetRefresh(key);
  }
}
