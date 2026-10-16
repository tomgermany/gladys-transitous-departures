
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



function departureLabel(stopName, destination) {
  // 1. Maximale Anzeigelänge und Trennzeichen festlegen.
  const separator = '»';
  const maxLength = 24;
  const nameBudget = maxLength - separator.length;

  // 2. Leerzeichen aus beiden Namen entfernen.
  //    So nutzen wir den verfügbaren Platz besser aus.
  const stop = String(stopName || 'Unbekannte Haltestelle')
    .trim()
    .replace(/\s+/g, '');
  const target = String(destination || 'Ziel unbekannt')
    .trim()
    .replace(/\s+/g, '');


  // 3. Zunächst reservieren wir 11 Zeichen für jeden Namen.
  let stopLength = Math.min(stop.length, 11);
  let targetLength = Math.min(target.length, 11);

  // 4. Ist die Abfahrt kürzer als 11 Zeichen, kann das Ziel
  //    den freien Platz nutzen. Ist das Ziel kürzer, erhält
  //    umgekehrt die Abfahrt den freien Platz.
  if (stop.length < 11) {
    stopLength = stop.length;
    targetLength = Math.min(target.length, nameBudget - stopLength);
  } else if (target.length < 11) {
    targetLength = target.length;
    stopLength = Math.min(stop.length, nameBudget - targetLength);
  }

  // 5. Die Abfahrt behält ihr Ende; das Ziel behält seinen Anfang.
  //    Beide Längen zusammen dürfen das Zeichenbudget nicht überschreiten.
  if (stopLength + targetLength > nameBudget) {
    targetLength = Math.max(0, nameBudget - stopLength);
  }


  // 6. Passt die Abfahrt immer noch nicht, kürzen wir sie
  //    von vorne. Das Ende der Haltestelle bleibt erhalten.
  if (stopLength + targetLength > nameBudget) {
    stopLength = Math.max(0, nameBudget - targetLength);
  }

  // 7. Die Abfahrt vom Anfang her und das Ziel vom Ende her
  //    auf die berechneten Längen begrenzen.
  const shortStop = stop.slice(Math.max(0, stop.length - stopLength));
  const shortTarget = target.slice(0, targetLength);

  // 8. Überflüssige Satzzeichen an den Rändern entfernen.
  //    Buchstaben lassen wir unangetastet, damit ungewöhnliche
  //    Haltestellennamen nicht versehentlich verändert werden.
  const cleanStop = shortStop.replace(/^[,.-]+|[,.-]+$/g, '');
  const cleanTarget = shortTarget.replace(/^[,.-]+|[,.-]+$/g, '');

  // 9. Namen verbinden und die maximale Länge absichern.
  return `${cleanStop}${separator}${cleanTarget}`.slice(0, maxLength);
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

        // card list für die Badge, Entfernung, Haltestellenname
        components.push({
          type: 'card-list',
          display: 'list',
          items: result.stopsSelected.slice(0, 8).map((stop) => ({
              title: stop.name,
              subtitle: `${stop.distanceMeters} m`,
              badge: {
                text: stop.category,
                color: stop.category === 'BUS' ? 'success' : 'info',
                },
            })),
          });

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
  `                ${departure.time ?? '--:--'}-${line.replace(/\s+/g, '')}`,
                  12,
                ),
                label: departureLabel(stopName, departure.destination),
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
