
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
};

const getMessages = (language) => {
  const lang = String(language).slice(0, 2).toLowerCase();
  return messages[lang] || messages.de;
};


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

      const radius = Number(settings.radius ?? 2000);
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

        return { ttl_seconds: ttlSeconds, components };
      } catch {
        components.push(text(t.transitousError));

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
