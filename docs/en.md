# Transitous Depatures Integration for Gladys

## You need:

Gladys Assistent > Version 5.2
External Integration Transitous Depatures

## Configuration

1. Install the Integration via Integrations under Gladys Assistant
2. or ... install directly via Integrations and Top you find: Intall dirctly from Github.
   use there: https://github.com/tomgermany/gladys-transitous-departures
3. After Installation check that Integration is running.
4. Open your Dashboard and go into Edit Modus and there add a new Widget.
   Select this Integration Widget.
5. You need the following information:
   Set the **latitude** and **longitude** from depart
   Set the Search Circle between 50 Meter and max. 2000 Meter
   Set the **refresh interval** sets how often the weather station
   Set a unique Name for the api
7. Save: the widget appear on your screen

## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys UI (or `docker logs` on the host) with `LOG_LEVEL=debug` for the full
detail.
