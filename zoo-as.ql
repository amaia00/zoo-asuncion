/*
	This is the query that retrieves all data inside the area of the zoo
	Esta es la consulta que trae todos los datos dentro del área del zoológico

	http://overpass-turbo.eu/
	THIS IS NOT A GEOJSON format, just a specifica overpass json format, you need 
	to convert this in geojson from the overpass site or with a specific tool
	// TODO: try to convert this automatically
	This query does not retrieve the zoo area properly. just the inner nodes and 
	ways
*/
/*
	http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
*/
[out:json];
area
  ["name"="Jardín Botánico y Zoológico de Asunción"]->.a;
(
  node
        (area.a);
  way
        (area.a);
);
out body qt;
>;
out body qt;
