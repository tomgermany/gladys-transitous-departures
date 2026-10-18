
import { getDepartures } from './transitous.js';

export const TRANSITOUS_DEPARTURES_WIDGET = 'transitous_departures';

const text = (value, variant = 'body') => ({
  type: 'text',
  variant,
  text: value,
});

/**
 * Zentrale Farbzuordnung für die Verkehrsmittelkategorien.
 *
 * Diese Farben werden für die Badges der Abfahrtskarten verwendet.
 * Ausgefallene Abfahrten erhalten unabhängig von der Kategorie
 * immer die Farbe danger.
 */
const CATEGORY_COLORS = {
  BUS: 'success',
  REGIONAL: 'info',
  SPECIAL: 'neutral',
  URBAN: 'warning',
  RAIL: 'primary',
};

const messages = {
  de: {
    heading: 'Abfahrten in der Nähe',
    houseLoadError:
      'Die Koordinaten des ausgewählten Gladys-Hauses konnten nicht geladen werden.',
    invalidLocation:
      'Bitte wähle ein Gladys-Haus mit hinterlegten Koordinaten oder trage Breitengrad und Längengrad manuell ein.',
    noStops: 'Im gewählten Umkreis wurden keine Haltestellen gefunden.',
    noDepartures: 'Im gewählten Umkreis wurden keine Abfahrten gefunden.',
    unknownDestination: 'Ziel unbekannt',
    transitousError:
      'Transitous ist momentan nicht erreichbar. Bitte prüfe deine Internetverbindung. Das Widget versucht es bei der nächsten Aktualisierung erneut.',
  },
  en: {
    heading: 'Public transport departures nearby',
    houseLoadError:
      'The coordinates of the selected Gladys house could not be loaded.',
    invalidLocation:
      'Please select a Gladys house with coordinates or enter latitude and longitude manually.',
    noStops: 'No stops were found within the selected radius.',
    noDepartures: 'No departures were found within the selected radius.',
    unknownDestination: 'Unknown destination',
    transitousError:
      'Transitous is currently unreachable. Please check your internet connection. The widget will try again at the next refresh.',
  },
  es: {
    heading: 'Salidas del transporte público cercano',
    houseLoadError:
      'No se han podido cargar las coordenadas de la casa Gladys seleccionada.',
    invalidLocation:
      'Selecciona una vivienda Gladys con coordenadas registradas o introduce manualmente la latitud y la longitud.',
    noStops: 'No se han encontrado paradas en el radio seleccionado.',
    noDepartures: 'No se han encontrado salidas en el radio seleccionado.',
    unknownDestination: 'Destino desconocido',
    transitousError:
      'Transitous no está disponible en este momento. Comprueba tu conexión a Internet. El widget lo volverá a intentar en la próxima actualización.',
  },
  fr: {
    heading: 'Départs des transports en commun à proximité',
    houseLoadError:
      'Impossible de charger les coordonnées de la maison Gladys sélectionnée.',
    invalidLocation:
      'Veuillez sélectionner une maison Gladys avec des coordonnées ou saisir manuellement la latitude et la longitude.',
    noStops: 'Aucun arrêt trouvé dans le rayon sélectionné.',
    noDepartures: 'Aucun départ trouvé dans le rayon sélectionné.',
    unknownDestination: 'Destination inconnue',
    transitousError:
      'Transitous est actuellement inaccessible. Vérifiez votre connexion Internet. Le widget réessaiera lors de la prochaine actualisation.',
  },
  ko: {
    heading: '주변 대중교통 출발 정보',
    houseLoadError: '선택한 Gladys 집의 좌표를 불러올 수 없습니다.',
    invalidLocation:
      '좌표가 저장된 Gladys 집을 선택하거나 위도와 경도를 수동으로 입력해 주세요.',
    noStops: '선택한 반경 내에 정류장이 없습니다.',
    noDepartures: '선택한 반경 내에 출발 정보가 없습니다.',
    unknownDestination: '알 수 없는 목적지',
    transitousError:
      '현재 Transitous에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요. 다음 새로고침 때 다시 시도합니다.',
  },
  kl: {
    heading: 'Qanitsumi angallatit aallartarfii',
    houseLoadError: 'Gladys-ip illuata toqqakkap nalaat aaneqarsinnaanngillat.',
    invalidLocation:
      'Gladys-illu nalaanik nalunaarsimasumik toqqagit imalt. sanimut ammut tikeq (latitude/longitude) nammineq allaguk.',
    noStops: 'Ujaasiffiup avatangiisiani uniffissanik nassaartoqanngilaq.',
    noDepartures: 'Ujaasiffiup avatangiisiani aallarnissanik nassaartoqanngilaq.',
    unknownDestination: 'Sumunnarnera ilisimaneqanngilaq',
    transitousError:
      'Transitous nal tanna attavigineqarsinnaanngilaq. Internetit pikkunnersaa takujuk. Widgeti tullianik nutarteruni misileqqissaaq.',
  },
};

const getMessages = (language) => {
  const lang = String(language ?? 'de').slice(0, 2).toLowerCase();
  return messages[lang] || messages.de;
};

// Der tatsächlich verwendete Suchradius darf niemals über 10 km liegen.
const MAX_RADIUS = 10000;

// Merkt sich den aktuellen Radius je Widget-Konfiguration.
const expandedRadii = new Map();

function getRadiusKey(settings) {
  return JSON.stringify({
    house: settings.house ?? '',
    latitude: settings.latitude ?? '',
    longitude: settings.longitude ?? '',
    radius1: Number(settings.radius1 ?? 500),
    radius2_add: Number(settings.radius2_add ?? 1500),
    radius3_add: Number(settings.radius3_add ?? 3000),
  });
}

function getRadiusSteps(settings) {
  const radius1 = Math.min(
    MAX_RADIUS,
    Math.max(1, Number(settings.radius1 ?? 500) || 500),
  );
  const radius2Add = Math.max(0, Number(settings.radius2_add ?? 1500) || 0);
  const radius3Add = Math.max(0, Number(settings.radius3_add ?? 3000) || 0);

  // Jeder Radius wird vom ursprünglichen Mittelpunkt aus gesucht.
  // Doppelte Stufen werden entfernt, etwa bei Erreichen von 10 km.
  return [
    ...new Set([
      radius1,
      Math.min(MAX_RADIUS, radius1 + radius2Add),
      Math.min(MAX_RADIUS, radius1 + radius2Add + radius3Add),
    ]),
  ];
}

/**
 * Erstellt das Radius-Label.
 * Der aktuelle Radius steht in eckigen Klammern.
 */
function getRadiusButtonLabel(steps, currentIndex, direction) {
  const radiusLabel = steps
    .map((radius, index) =>
      index === currentIndex ? `[${radius}]` : String(radius),
    )
    .join(' - ');

  return direction === 'backward'
    ? `← ${radiusLabel}`
    : `${radiusLabel} →`;
}

function addRadiusButton(components, settings, currentRadius) {
  const steps = getRadiusSteps(settings);

  if (steps.length < 2) return;

  const radiusKey = getRadiusKey(settings);
  const savedState = expandedRadii.get(radiusKey) ?? {
    radius: currentRadius,
    direction: 'forward',
  };

  const savedIndex = steps.indexOf(savedState.radius);
  const currentIndex =
    savedIndex >= 0 ? savedIndex : Math.max(0, steps.indexOf(currentRadius));

  // An den Endpunkten die Suchrichtung umkehren.
  let direction = savedState.direction;

  if (currentIndex === steps.length - 1) {
    direction = 'backward';
  } else if (currentIndex === 0) {
    direction = 'forward';
  }

  const targetIndex =
    direction === 'backward' ? currentIndex - 1 : currentIndex + 1;

  components.push({
    type: 'button',
    label: getRadiusButtonLabel(steps, currentIndex, direction),
    style: 'secondary',
    action: {
      key: 'change_radius',
      params: {
        radius: steps[targetIndex],
        direction,
      },
    },
  });
}

/**
 * Kürzt Texte, ohne die Anwendung bei unerwartet langen API-Werten
 * zu beeinträchtigen.
 */
function shortText(value, maxLength) {
  const result = String(value ?? '').trim();
  if (result.length <= maxLength) return result;
  return `${result.slice(0, maxLength - 1)}…`;
}

/**
 * Erstellt eine Abfahrtskarte für die card-list.
 *
 * image wird erst ergänzt, wenn die Bildbereitstellung vorhanden ist.
 * Das SDK-Feld date erhält einen ISO-8601-Zeitstempel.
 */
function createDepartureCard(departure, distanceByStopId, messages) {
  const cancelled = departure.status === 'CANCELLED';
  const line = departure.line || departure.displayedMode || '';
  const distance = distanceByStopId.get(departure.stopId);

  return {
    // Haltestelle der jeweiligen Abfahrt.
    title: shortText(departure.stopName || 'Unbekannte Haltestelle', 60),

    // Entfernung zur passenden Haltestelle.
    // Wenn keine Entfernung zugeordnet werden kann, bleibt das Feld leer.
    ...(distance !== undefined
      ? { subtitle: `${distance} m` }
      : {}),

    // Absoluter Zeitpunkt. Gladys kann ihn in der Benutzerzeitzone darstellen.
   date: new Date(departure.epochMs).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }),

    // Bild- und Icon-Unterstützung wird in einem späteren Schritt ergänzt.

    // Die Badge-Farbe übernimmt die bisherige zentrale Farblogik.
    // Ausfälle sind immer rot; ansonsten gilt die Verkehrsmittelkategorie.
    badge: {
      text: shortText(line || messages.unknownDestination, 16),
      color: cancelled
        ? 'danger'
        : CATEGORY_COLORS[departure.category] || 'primary',
    },

    // Fahrtziel der Abfahrt.
    description: shortText(
      departure.destination || messages.unknownDestination,
      2000,
    ),
  };
}

export const WIDGETS = {
  [TRANSITOUS_DEPARTURES_WIDGET]: {
    async get(gladys, { settings = {}, language = 'de' }) {
      let latitude;
      let longitude;

      const radiusKey = getRadiusKey(settings);
      const steps = getRadiusSteps(settings);
      const savedState = expandedRadii.get(radiusKey);

      // Ohne vorherige Radiusänderung beginnt die Suche mit Stufe 1.
      const radius =
        savedState && steps.includes(savedState.radius)
          ? savedState.radius
          : steps[0];

      const count = [3, 6].includes(Number(settings.count))
        ? Number(settings.count)
        : 6;

      const refreshMinutes = Number(settings.refresh_minutes ?? 30);
      const ttlSeconds = Math.min(3600, Math.max(600, refreshMinutes * 60));

      const t = getMessages(language);
      const components = [text(t.heading, 'heading')];

      // Koordinaten aus dem ausgewählten Gladys-Haus laden.
      if (settings.house) {
        try {
          const response = await fetch(
            `${process.env.GLADYS_HOST_API_URL}/api/integration/v1/house`,
            {
              headers: {
                Authorization: `Bearer ${process.env.GLADYS_INTEGRATION_TOKEN}`,
              },
            },
          );

          if (!response.ok) {
            throw new Error('Häuser konnten nicht geladen werden.');
          }

          const houses = await response.json();
          const house = houses.find((item) => item.selector === settings.house);

          if (
            house &&
            house.latitude !== null &&
            house.latitude !== undefined &&
            house.longitude !== null &&
            house.longitude !== undefined
          ) {
            latitude = Number(house.latitude);
            longitude = Number(house.longitude);
          }
        } catch {
          components.push(text(t.houseLoadError));
          return { ttl_seconds: ttlSeconds, components };
        }
      } else {
        // Alternativ manuell eingegebene Koordinaten verwenden.
        latitude =
          settings.latitude === undefined ||
          settings.latitude === null ||
          settings.latitude === ''
            ? NaN
            : Number(settings.latitude);

        longitude =
          settings.longitude === undefined ||
          settings.longitude === null ||
          settings.longitude === ''
            ? NaN
            : Number(settings.longitude);
      }

      // Ungültige oder fehlende Koordinaten frühzeitig abfangen.
      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        components.push(text(t.invalidLocation));
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

        if (!result.departures.length) {
          components.push(text(t.noStops));
          components.push(text(t.noDepartures));
          addRadiusButton(components, settings, radius);

          return { ttl_seconds: ttlSeconds, components };
        }

        // Entfernung anhand der stopId zuordnen.
        // So erhält jede Abfahrt die Entfernung ihrer eigenen Haltestelle.
        const distanceByStopId = new Map(
          result.stopsSelected.map((stop) => [
            stop.stopId,
            stop.distanceMeters,
          ]),
        );

        // Eine einzige card-list ersetzt die bisherige Haltestellenliste
        // und die einzelnen value-Kacheln.
        components.push({
          type: 'card-list',
          display: 'grid',
          items: result.departures
            .slice(0, count)
            .map((departure) =>
              createDepartureCard(departure, distanceByStopId, t),
            ),
        });

        addRadiusButton(components, settings, radius);

        // Gladys erlaubt höchstens acht Komponenten.
        // Bei Bedarf zuerst die Überschrift entfernen.
        if (components.length > 8 && components[0]?.variant === 'heading') {
          components.shift();
        }

        // Nur falls nötig den Radius-Button entfernen.
        // Die Abfahrtskarten bleiben erhalten.
        if (components.length > 8) {
          const buttonIndex = components.findIndex(
            (component) => component.type === 'button',
          );

          if (buttonIndex !== -1) components.splice(buttonIndex, 1);
        }

        return { ttl_seconds: ttlSeconds, components };
      } catch {
        components.push(text(t.transitousError));
        addRadiusButton(components, settings, radius);

        if (components.length > 8) components.shift();

        return { ttl_seconds: ttlSeconds, components };
      }
    },

    async action(gladys, { actionKey, params = {}, settings = {} }) {
      if (actionKey !== 'change_radius') return;

      const radiusKey = getRadiusKey(settings);
      const steps = getRadiusSteps(settings);
      const requestedRadius = Number(params.radius);
      const requestedIndex = steps.indexOf(requestedRadius);

      // Nur tatsächlich konfigurierte Radiusstufen akzeptieren.
      if (requestedIndex < 0) return;

      const currentState = expandedRadii.get(radiusKey) ?? {
        radius: steps[0],
        direction: 'forward',
      };

      const currentIndex = steps.indexOf(currentState.radius);

      // Der Button darf nur zur unmittelbar benachbarten Stufe wechseln.
      if (
        currentIndex < 0 ||
        Math.abs(requestedIndex - currentIndex) !== 1
      ) {
        return;
      }

      let direction =
        requestedIndex > currentIndex ? 'forward' : 'backward';

      if (requestedIndex === steps.length - 1) {
        direction = 'backward';
      } else if (requestedIndex === 0) {
        direction = 'forward';
      }

      expandedRadii.set(radiusKey, {
        radius: requestedRadius,
        direction,
      });
    },
  },
};

/**
 * Aktualisiert alle registrierten Widgets.
 */
export function refreshWidgets(gladys) {
  for (const key of Object.keys(WIDGETS)) {
    gladys.requestWidgetRefresh(key);
  }
}
