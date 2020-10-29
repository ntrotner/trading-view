# Programmierentwurf Crypto-Trading App

## Kernfunktionalitäten
Es soll eine mobile App entwickelt werden, die den aktuellen Wert, historischen Kursverlauf, sowie weitere Daten von mehreren Cryptowährungen anzeigen und mithilfe von Grafiken visualisieren kann.  
Weiterhin soll der Benutzer mit hypothetischem, also keinem echten Geld, in die Cryptowährungen investieren können, sowie diese verkaufen können.  
Über Push-Benachrichtigungen kann der Benutzer über plötzliche Kursbewegungen informiert werden, um entsprechend handeln zu können.  
Die Auslöser dafür sollen für den Benutzer konfigurierbar sein.


## Optional
- Stop-Loss-Order sollen konfigurierbar sein, um Verluste zu begrenzen.
- Buy-Order um ab einem gewissen Kurs zu kaufen
- Sell-Order für den Verkauf ab einen gewissen Kurs



## Konzeptbilder
Die folgenden Abbildungen stellen bisher nur das Grundkonzept dar. Die finale Version wird wahrscheinlich mehr oder weniger davon abweichen.



## Plattform, API und Komponenten
Die App soll mit Ionic Angular entwickelt werden, womit sie eine hybride sein wird. Um die Cryptodaten zu empfangen, soll die API von Bitstamp https://www.bitstamp.net/api, einer Cryptowährungsbörse, verwendet werden.  
Für den Http-Client, die graphischen Darstellungen und die Push-Benachrichtigungen müssen externe Bibliotheken eingebunden werden.  
Für weitere Komponenten kann dies auch erforderlich werden, jedoch wird möglichst versucht, immer Ionic Komponenten zu verwenden.



## Allgemeines
Beteiligte Studenten: Frederic Heil, Nikita Trotner.


