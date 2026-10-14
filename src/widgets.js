
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
    stops
      .map(
        (stop) =>
          `${stop.name} (${stop.category}, ${stop.distanceMeters} m)`,
      )
      .join(' · '),
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

      const ttlSeconds = Math.min(
        3600,
        Math.max(600, refreshMinutes * 60),
      );

      const components = [
        text('ÖPNV-Abfahrten in der Nähe', 'heading'),
      ];

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

        components.push({
          type: 'card-list',
          display: 'list',
          items: result.departures.slice(0, 8).map((departure) => {
            const line = departure.line
              ? `Linie ${departure.line}`
              : departure.displayedMode;

            const destination = departure.destination || 'Ziel unbekannt';

            const subtitleParts = [departure.displayedMode];

            if (departure.platform) {
              subtitleParts.push(`Steig ${departure.platform}`);
            }

            const item = {
              title: shortText(
                `${departure.time ?? '--:--'} · ${line} → ${destination}`,
                60,
              ),
              subtitle: shortText(subtitleParts.join(' · '), 60),
            };

            if (departure.status === 'CANCELLED') {
              item.badge = {
                text: 'ENTFÄLLT',
                color: 'danger',
              };
            } else if (departure.status === 'REALTIME') {
              item.badge = {
                text: 'Echtzeit',
                color: 'success',
              };
            }

            return item;
          }),
        });

        return { ttl_seconds: ttlSeconds, components };
      } catch (error) {
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
