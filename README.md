# Elektro Lüdorf – Website (statisches HTML)

Reine HTML/CSS/JS-Seiten ohne Build-Schritt und ohne externe Dienste. Läuft auf jedem Webhosting; das Anfrageformular braucht PHP 7.4+ mit `mail()`.

## Seiten

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite: Einstieg, Themenwahl, Leistungen, Sicherungskasten erklärt, Ablauf, Fragen, Kontakt |
| `leistungen.html` | Alle Leistungen mit Unternavigation, je Thema ein Link ins Formular |
| `kontakt.html` | Anfrageformular (Thema, Beschreibung, bis zu 5 Fotos, Kontaktdaten) |
| `danke.html`, `fehler.html` | Rückmeldung nach dem Absenden ohne JavaScript |
| `impressum.html`, `datenschutz.html` | Rechtstexte mit Bildnachweis |
| `404.html` | Seite nicht gefunden |
| `anfrage.php` | Prüft das Formular und schickt es per E-Mail (mit Anhängen) |

Themen-Links: `kontakt.html?thema=wallbox#anfrage` wählt das Thema im Formular vor
(`installation`, `licht`, `reparatur`, `verteilung`, `smart-home`, `wallbox`, `photovoltaik`, `sonstiges`).

## Offene Punkte vor dem Livegang

Alle noch fehlenden Angaben sind in den Seiten **gelb gestreift markiert** (`<span class="ph">`).
Suchen nach `class="ph"` zeigt jede Stelle. Nichts davon wurde erfunden.

Bereits eingetragen (17.11.2026): Inhaber Rainer Lüdorf, Ullenbeck 16, 40885 Ratingen, Telefon 02102 5534453, E-Mail elektro-luedorf@gmx.de.

1. **Öffnungszeiten / Erreichbarkeit** (Startseite, Leistungen, Kontakt).
2. **Impressum**: USt-IdNr., Berufsbezeichnung, Betriebsnummer der Handwerksrolle.
3. **Datenschutz**: Hosting-Anbieter, Löschfrist der Logdaten, Stand.
4. **`anfrage.php`**: Empfänger ist eingetragen. Es fehlt noch `absender` – eine Adresse auf der Domain der Website (z. B. `website@<domain>`). Solange leer, sendet das Formular nichts und zeigt einen Hinweis mit der Telefonnummer.
5. **Leistungen bestätigen lassen** – Texte stammen von der bisherigen Website; der Inhaber sollte sie prüfen.
6. **Eigene Fotos** – derzeit Wikimedia-Commons-Fotos (siehe Bildnachweis im Impressum). Bei eigenen Fotos den Bildnachweis anpassen.
7. **Logo** – Blitz-Zeichen ist ein Platzhalter (`img/favicon.svg` und `.brand-mark` im Kopf).
8. **Suchmaschinen freigeben** – in allen Seiten `<meta name="robots" content="noindex, nofollow">` auf `index, follow` stellen, `robots.txt` ersetzen und eine `sitemap.xml` mit der Domain anlegen.
9. Optional: Bewertungen, Meisterbetrieb/Innung, Einsatzorte – erst eintragen, wenn bestätigt.

## Gestaltung

- Systemschrift (SF Pro auf Apple-Geräten, Segoe UI auf Windows) – keine Fonts von fremden Servern.
- Farben in `css/style.css` unter `:root`: Blau `#174B70` = Marke und Links, Bernstein `#F59E0B` = Handlungen (Anfrage, Anrufen). Kontraste: Fließtext 8,1 : 1, Weiß auf Blau 9,2 : 1, Schwarz auf Bernstein 7,8 : 1.
- Bewegung nur als Rückmeldung (Druck auf Buttons, Menü, Fragen aufklappen, Formular-Bestätigung); bei „Bewegung reduzieren“ entfallen alle Verschiebungen.
- Mobil: feste Leiste mit „Anrufen“ und „Anfrage senden“, die beim Tippen in ein Feld verschwindet.
