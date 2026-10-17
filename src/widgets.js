
import { getDepartures } from './transitous.js';

export const TRANSITOUS_DEPARTURES_WIDGET = 'transitous_departures';

const text = (value, variant = 'body') => ({
  type: 'text',
  variant,
  text: value,
});

const messages = {
  de: {
    heading: 'ÖPNV-Abfahrten in der Nähe',
    houseLoadError: 'Die Koordinaten des ausgewählten Gladys-Hauses konnten nicht geladen werden.',
    invalidLocation: 'Bitte wähle ein Gladys-Haus mit hinterlegten Koordinaten oder trage Breitengrad und Längengrad manuell ein.',
    noStops: 'Im gewählten Umkreis wurden keine Haltestellen gefunden.',
    noDepartures: 'Im gewählten Umkreis wurden keine Abfahrten gefunden.',
    unknownDestination: 'Ziel unbekannt',
    transitousError: 'Transitous ist momentan nicht erreichbar. Bitte prüfe deine Internetverbindung. Das Widget versucht es bei der nächsten Aktualisierung erneut.',
  },
  en: {
    heading: 'Public transport departures nearby',
    houseLoadError: 'The coordinates of the selected Gladys house could not be loaded.',
    invalidLocation: 'Please select a Gladys house with coordinates or enter latitude and longitude manually.',
    noStops: 'No stops were found within the selected radius.',
    unknownDestination: 'Unknown destination',
    noDepartures: 'No departures were found within the selected radius.',
    transitousError: 'Transitous is currently unreachable. Please check your internet connection. The widget will try again at the next refresh.',
  },
  es:{
    heading: 'Salidas del transporte público cercano',
    houseLoadError: 'No se han podido cargar las coordenadas de la casa Gladys seleccionada.',
    invalidLocation: 'Selecciona una vivienda Gladys con coordenadas registradas o introduce manualmente la latitud y la longitud.',
    noStops: 'No se han encontrado paradas en el radio seleccionado.',
    noDepartures: 'No se han encontrado salidas en el radio seleccionado.',
    unknownDestination: 'Destino desconocido',
    transitousError: 'Transitous no está disponible en este momento. Comprueba tu conexión a Internet. El widget lo volverá a intentar en la próxima actualización.',    
  },
  fr: {
    heading: 'Départs des transports en commun à proximité',
    houseLoadError: 'Impossible de charger les coordonnées de la maison Gladys sélectionnée.',
    invalidLocation: 'Veuillez sélectionner une maison Gladys avec des coordonnées ou saisir manuellement la latitude et la longitude.',
    noStops: 'Aucun arrêt trouvé dans le rayon sélectionné.',
    unknownDestination: 'Destination inconnue',
    noDepartures: 'Aucun départ trouvé dans le rayon sélectionné.',
    transitousError: 'Transitous est actuellement inaccessible. Vérifiez votre connexion Internet. Le widget réessaiera lors de la prochaine actualisation.',
  },
  ko: {
    heading: '주변 대중교통 출발 정보',
    houseLoadError: '선택한 Gladys 집의 좌표를 불러올 수 없습니다.',
    invalidLocation: '좌표가 저장된 Gladys 집을 선택하거나 위도와 경도를 수동으로 입력해 주세요.',
    noStops: '선택한 반경 내에 정류장이 없습니다.',
    noDepartures: '선택한 반경 내에 출발 정보가 없습니다.',
    unknownDestination: '알 수 없는 목적지',
    transitousError: '현재 Transitous에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요. 다음 새로고침 때 다시 시도합니다.',
  },
  kl: {
    heading: 'Qanitsumi angallatit aallartarfii',
    houseLoadError: 'Gladys-ip illuata toqqakkap nalaat aaneqarsinnaanngillat.',
    invalidLocation: 'Gladys-illu nalaanik nalunaarsimasumik toqqagit imalt. sanimut ammut tikeq (latitude/longitude) nammineq allaguk.',
    noStops: 'Ujaasiffiup avatangiisiani uniffissanik nassaartoqanngilaq.',
    noDepartures: 'Ujaasiffiup avatangiisiani aallarnissanik nassaartoqanngilaq.',
    unknownDestination: 'Sumunnarnera ilisimaneqanngilaq',
    transitousError: 'Transitous nal tanna attavigineqarsinnaanngilaq. Internetit pikkunnersaa takujuk. Widgeti tullianik nutarteruni misileqqissaaq.',
  },
};

const getMessages = (language) => {
  const lang = String(language).slice(0, 2).toLowerCase();
  return messages[lang] || messages.de;
};

const RADII = [500, 2000, 5000, 10000];

const expandedRadii = new Map();

function getRadiusKey(settings) {
  return JSON.stringify({
    house: settings.house ?? '',
    latitude: settings.latitude ?? '',
    longitude: settings.longitude ?? '',
    radius: Number(settings.radius ?? 2000),
  });
}

function getNextRadius(radius) {
  const index = RADII.indexOf(Number(radius));

  if (index < 0 || index >= RADII.length - 1) {
    return null;
  }

  return RADII[index + 1];
}
// Den vorherigen Suchradius ermitteln.
// Gibt null zurück, wenn der kleinste Radius bereits erreicht ist.
function getPreviousRadius(radius) {
  const index = RADII.indexOf(Number(radius));
  return index > 0 ? RADII[index - 1] : null;
}

function formatRadius(radius) {
  return radius < 1000
    ? `${radius} m`
    : `${radius / 1000} km`;
}

function getRadiusButtonLabel(language, radius) {
  const lang = String(language ?? 'de')
    .slice(0, 2)
    .toLowerCase();

  const distance = formatRadius(radius);

  const labels = {
    de: `Weiter suchen: ${distance}`,
    en: `Search farther: ${distance}`,
    es: `Ampliar radio: ${distance}`,
    fr: `Élargir rayon : ${distance}`,
    ko: `반경 확대: ${distance}`,
    kl: `Ujaasinerup annertusinerani: ${distance}`,
  };

  return labels[lang] || labels.de;
}


function getPreviousRadiusButtonLabel(language, radius) {
  const lang = String(language ?? 'de')
    .slice(0, 2)
    .toLowerCase();

  const distance = formatRadius(radius);

  // Beschriftung für den Button zum Verkleinern des Suchradius.
  const labels = {
    de: `Zurück: ${distance}`,
    en: `Search closer: ${distance}`,
    es: `Reducir radio: ${distance}`,
    fr: `Réduire le rayon : ${distance}`,
    ko: `반경 축소: ${distance}`,
    kl: `Ujaasinerup annikillinerani: ${distance}`,
  };

  return labels[lang] || labels.de;
}



function addRadiusButton(components, radius, language) {
  const previousRadius = getPreviousRadius(radius);
  const nextRadius = getNextRadius(radius);

  // Wenn ein kleinerer Radius existiert, den Zurück-Button anzeigen.
  if (previousRadius !== null) {
    components.push({
      type: 'button',
      label: getPreviousRadiusButtonLabel(language, previousRadius),
      icon: 'search',
      style: 'secondary',
      action: {
        key: 'change_radius',
        params: {
          radius: previousRadius,
        },
      },
    });
  }

  // Wenn ein größerer Radius existiert, den Weiter-Button anzeigen.
  if (nextRadius !== null) {
    components.push({
      type: 'button',
      label: getRadiusButtonLabel(language, nextRadius),
      icon: 'search',
      style: 'secondary',
      action: {
        key: 'change_radius',
        params: {
          radius: nextRadius,
        },
      },
    });
  }
}


function shortText(value, maxLength) {
  const result = String(value ?? '').trim();
  if (result.length <= maxLength) return result;
  return `${result.slice(0, maxLength - 1)}…`;
}

export const WIDGETS = {
  [TRANSITOUS_DEPARTURES_WIDGET]: {
    async get(gladys, { settings = {}, language = 'de' }) {
      let latitude;
      let longitude;

      const baseRadius = Number(settings.radius ?? 2000);
      const radiusKey = getRadiusKey(settings);
      const radius = expandedRadii.get(radiusKey) ?? baseRadius;
      const count = Number(settings.count ?? 6);
      const refreshMinutes = Number(settings.refresh_minutes ?? 30);

      const ttlSeconds = Math.min(3600, Math.max(600, refreshMinutes * 60));

      const t = getMessages(language);
      const components = [text(t.heading, 'heading')];

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
          components.push(
            text(t.houseLoadError)
          );
          return { ttl_seconds: ttlSeconds, components };
        }
      } else {
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
    text(t.noStops)
  );
}

        if (!result.departures.length) {
          components.push(
            text(t.noDepartures)
          );

          addRadiusButton(components, radius, language);

          return { ttl_seconds: ttlSeconds, components };
        }

        components.push(
          ...result.departures.slice(0, count).map((departure) => {
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
                label: shortText(departure.destination || t.unknownDestination, 24),
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
        
        // Den Erweiterungsbutton auch bei gefundenen Abfahrten anzeigen.
        addRadiusButton(components, radius, language);

        // Gladys erlaubt maximal acht Komponenten pro Widget.
        // Zuerst die Überschrift entfernen, wenn sie zu viel Platz belegt.
        if (components.length > 8) {
          components.shift();
        }

        // Falls zwei Radius-Buttons angezeigt werden, kann es weiterhin
        // zu viele Komponenten geben. Dann einzelne Abfahrtskacheln entfernen,
        // bis das Widget die Grenze von acht Komponenten einhält.
        while (components.length > 8) {
          const departureIndex = components.findIndex(
            (component) => component.type === 'value',
          );

          // Keine Abfahrtskachel mehr zum Entfernen gefunden.
          if (departureIndex === -1) {
            break;
          }

          components.splice(departureIndex, 1);
        }

        // Das fertige Widget mit allen übrigen Komponenten zurückgeben.
        return { ttl_seconds: ttlSeconds, components };

      } catch {
        components.push(text(t.transitousError));

        addRadiusButton(components, radius, language);

        return { ttl_seconds: ttlSeconds, components };
      }
    },

    
  async action(gladys, { actionKey, params = {}, settings = {} }) {
    // Nur Aktionen zum Ändern des Suchradius verarbeiten.
    if (actionKey !== 'change_radius') {
      return;
    }

    // Den aktuellen Radius für dieses Widget ermitteln.
    const radiusKey = getRadiusKey(settings);
    const currentRadius =
      expandedRadii.get(radiusKey) ?? Number(settings.radius ?? 2000);

    // Ermitteln, welche beiden Radius-Schritte erlaubt sind.
    const previousRadius = getPreviousRadius(currentRadius);
    const nextRadius = getNextRadius(currentRadius);

    // Den vom Button angeforderten Radius auslesen.
    const requestedRadius = Number(params.radius);

    // Nur einen direkten Schritt nach vorne oder hinten zulassen.
    if (
      requestedRadius !== previousRadius &&
      requestedRadius !== nextRadius
    ) {
      return;
    }

    // Den neuen Radius setzen. Die nächste Widget-Ausführung
    // führt die Suche mit diesem Radius erneut aus.
    expandedRadii.set(radiusKey, requestedRadius);
  },
},
};


export function refreshWidgets(gladys) {
  for (const key of Object.keys(WIDGETS)) {
    gladys.requestWidgetRefresh(key);
  }
}
