
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

export const WIDGETS = {
  [TRANSITOUS_DEPARTURES_WIDGET]: {
    async get(gladys, { settings = {}, language = 'de' }) {
      const latitude = Number(settings.latitude);
      const longitude = Number(settings.longitude);
      const radius = Number(settings.radius ?? 2000);
      const count = Number(settings.count ?? 6);
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

        // Card-list für Badge, Entfernung und Haltestellenname
        if (result.stopsSelected.length > 0) {
          components.push({
          type: 'card-list',
          display: 'list',
          items: result.stopsSelected.slice(0, 8).map((stop) => ({
              title: `${stop.distanceMeters} m · ${stop.name}`,
              badge: {
                  text: stop.category,
                  color: stop.category === 'BUS' ? 'success' : 'info',
                  },
                })),
          });
} else {
  components.push(
    text('Im gewählten Umkreis wurden keine Haltestellen gefunden.'),
  );
}

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

            return {
                type: 'value',
                value: shortText(
  `                ${departure.time ?? '--:--'}-${line.replace(/\s+/g, '')}`,
                  12,
                ),
                label: shortText(departure.destination || 'Ziel unbekannt', 24),
                icon: ({
                  BUS: 'bus',
                  ODM: 'bus',
                  FERRY: 'ship',
                  FUNICULAR: 'maximize-2',
                  TRAM: 'train-front',
                  SUBWAY: 'train-front',
                  RAIL: 'train-front',
                  REGIONAL_RAIL: 'train-front',
                  REGIONAL_FAST_RAIL: 'train-front',
                  SUBURBAN: 'train-front',
                  HIGHSPEED_RAIL: 'train-front',
                  HIGH_SPEED_RAIL: 'train-front',
                  LONG_DISTANCE: 'train-front',
                  NIGHT_RAIL: 'train-front',
                })[departure.mode] || 'bus',
                color: cancelled ? 'danger' : lineColor,
            };
          }),
        );

        return { ttl_seconds: ttlSeconds, components };
      } catch {
        const errorMessage = {
          de: 'Transitous ist momentan nicht erreichbar. Bitte prüfe deine Internetverbindung. Das Widget versucht es bei der nächsten Aktualisierung erneut.',
          en: 'Transitous is currently unreachable. Please check your internet connection. The widget will try again at the next refresh.',
          fr: 'Transitous est actuellement inaccessible. Vérifiez votre connexion Internet. Le widget réessaiera lors de la prochaine actualisation.',
        };

        const lang = String(language).slice(0, 2).toLowerCase();

        components.push(
          text(errorMessage[lang] || errorMessage.de),
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
