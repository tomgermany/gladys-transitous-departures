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

![Testergebnisse – Beispielansicht der Transitous-Integration](../images/test-1.png)

Result: For each of the six tiles, the nearest stop is first determined once. That is, the nearest bus stop, nearest ferry, and nearest rail stop.
The next departure from that stop is then displayed.
This means: If there is only one stop within your search radius, you will see the next six departures.
If multiple stops are found, they are displayed using color coding.



## Configuration

1. Install the external integration either through Gladys Assistant (recommended)
 or in Gladys Assistant with direct access to GitHub.

2. After Installation check that Integration is running.
   
3. Open your Dashboard and go into Edit Modus and there add the new Widget.
   Select this Integration Widget.
   
4. When adding the widget to your dashboard, you’ll need some information:
   
a.) Your geolocation as the starting point
 (or choose location from Gladys Assistant)
 
5.) The diameter of the search radius.

6.) The refresh interval in 10-minute increments.

7.) A unique identifier for API access at https://transitous.org/.
This identifier must be unique—for example, an email address or website.
It is stored by the integration only in the configuration field there.
The integration neither retrieves nor documents this identifier.
Everything remains with you. Transitous.org uses this identifier to manage the load on its IT infrastructure.
Keep in mind the data provider when setting this. We recommend 30 minutes.

8. After filling out this information, save it and place the widget where you want it.

Specifically: Either select your Galdys house or enter a geolocation of your choice.
Below that, you can define three search radii in metres. This means that bus stops will be searched for within these radii.
The individual radii are added together. If radius 1 is set to 300 metres and you enter 200 metres for radius 2, then
radius 2 will have a search radius of 500 metres:

![Konfiguration – Beispielansicht der Transitous-Integration](../images/test-2.png)

In the lower section, you can then choose to reschedule the time display. The time currently shown is the time today when Gladys Assistant starts. Using the drop-down menu, you can reschedule the display by the number of days you wish; for example, 14:00 plus 1 day = tomorrow at 14:00. The time is always based on when the application starts. We recommend that you do not walk for less than 30 minutes. Finally, Transitous asks for a ‘connoisseur’; we do not store this (except in the configuration field) and do not use it. It is used exclusively by Transitous:

![Konfiguration – Beispielansicht der Transitous-Integration](../images/test-3.png)



## Operation

In the top image, you will see a button. This displays the three search areas you have selected, and with each click you move up and then down through these search areas.

The results are initially displayed in the top six tiles. These show: an icon representing the mode of transport (bus, train, aeroplane, ferry, etc.). Below that, the departure time and the destination station.

Each mode of transport has its own colour. Special transport services such as ferries, cable cars, as well as call-a-taxi and Moonliner services, are shown in grey. Cancelled or disrupted journeys are shown in red.

At the bottom of the screen, you will see a list of the stops found. These initially show the stop name, followed by the route number (also colour-coded), the distance from your current location and, where available, the type of vehicle.


## Troubleshooting

The integration logs everything it does: check the integration logs from the
Gladys UI (or `docker logs` on the host) with `LOG_LEVEL=debug` for the full
detail.
