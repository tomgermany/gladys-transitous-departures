
import { GladysIntegration, logger } from '@gladysassistant/integration-sdk';
import { WIDGETS, refreshWidgets } from './src/widgets.js';
import { readFile } from 'node:fs/promises';

const gladys = new GladysIntegration();

/**
 * Stellt Bilder für die Abfahrtskarten bereit.
 *
 * Der SDK-Bildschlüssel lautet "bus-test".
 * Die Bilddatei selbst heißt weiterhin "bus_test.png".
 *
 * Neue Bildschlüssel müssen später hier ergänzt werden,
 * wenn weitere Verkehrsmittelkategorien eigene Bilder erhalten.
 */
gladys.onWidgetGetImage(async (imageKey) => {
  // Aktuell verwenden alle Abfahrtskarten dasselbe Testbild.
  if (imageKey !== 'bus-test') {
    throw new Error(`Unbekannter Widget-Bildschlüssel: ${imageKey}`);
  }

  // Die Datei liegt im Docker-Image unter /app/images/bus_test.png.
  const image = await readFile(
    new URL('./images/bus_test.png', import.meta.url),
  );

  // Das SDK erwartet den Bildinhalt als Base64 ohne data:-Präfix.
  return image.toString('base64');
});

// Dashboard-Widgets registrieren.
for (const [widgetKey, widget] of Object.entries(WIDGETS)) {
  gladys.onWidgetGet(widgetKey, (request) => widget.get(gladys, request ?? {}));

  // Aktionen registrieren, sofern das Widget Aktionen bereitstellt.
  if (typeof widget.action === 'function') {
    gladys.onWidgetAction(widgetKey, (actionKey, params, { settings }) =>
      widget.action(gladys, { actionKey, params, settings }),
    );
  }
}

// Einstellungen wurden in Gladys geändert: Widget aktualisieren.
gladys.onConfigUpdated(async () => {
  logger.info('Konfiguration aktualisiert');
  refreshWidgets(gladys);
});

// Nach erfolgreicher Verbindung den Status melden und
// offene Dashboard-Widgets zur Aktualisierung auffordern.
gladys.on('connected', async () => {
  try {
    await gladys.setConnectionStatus(true);
    refreshWidgets(gladys);
    logger.info('Transitous-Integration verbunden');
  } catch (err) {
    logger.error('Initialisierung fehlgeschlagen', err);

    await gladys
      .setConnectionStatus(false, {
        en: 'Initialization failed, check the integration logs.',
        de: 'Initialisierung fehlgeschlagen. Bitte die Integrationsprotokolle prüfen.',
        fr: "L'initialisation a échoué. Consultez les journaux de l'intégration.",
      })
      .catch(() => {});
  }
});

// Sauberes Beenden.
gladys.handleShutdown((signal) => {
  logger.info(`Beende Integration: ${signal}`);
});

// Verbindung zu Gladys starten.
logger.info('Starte Transitous-Integration...');

gladys.connect().catch((err) => {
  logger.error('Verbindung zu Gladys fehlgeschlagen', err);
  process.exit(1);
});
