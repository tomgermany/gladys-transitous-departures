# Transitous Depatures Integration for Gladys

## You need:

Gladys Assistent > Version 5.2
External Integration Transitous Depatures
Internet Access for Your Gladys Assistant Installation

## You get:

You'll receive an external integration for Galdys Assistant. 
This integration automatically displays the next 6 public transportation departures in a clear, easy-to-read widget—from buses to trains, ferries, and cable cars.
All of this within a configurable radius around your home.

Example:

![Lissabon – Beispielansicht der Transitous-Integration](../test/lissabon.png)

## Configuration

1. Install the external integration either through Gladys Assistant (recommended)
 or in Gladys Assistant with direct access to GitHub.
3. After Installation check that Integration is running.
4. Open your Dashboard and go into Edit Modus and there add the new Widget.
   Select this Integration Widget.
5. When adding the widget to your dashboard, you’ll need some information:
a.) Your geolocation as the starting point
 (the next development phase will allow you to import data from Gladys Assistant)
b.) The diameter of the search radius.
c.) The refresh interval in 10-minute increments.
d. A unique identifier for API access at https://transitous.org/.
This identifier must be unique—for example, an email address or website.
It is stored by the integration only in the configuration field there.
The integration neither retrieves nor documents this identifier.
Everything remains with you. Transitous.org uses this identifier to manage the load on its IT infrastructure.
Keep in mind the data provider when setting this. We recommend 15 minutes.
6. After filling out this information, save it and place the widget where you want it.


## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys UI (or `docker logs` on the host) with `LOG_LEVEL=debug` for the full
detail.
