/*
	This is the query that retrieves all data inside the area of the zoo
	Esta es la consulta que trae todos los datos dentro del área del zoológico

	http://overpass-turbo.eu/
	THIS IS NOT A GEOJSON format, just a specifica overpass json format, you need 
	to convert this in geojson from the overpass site or with a specific tool
	// TODO: try to convert this automatically
*/
[out:json];
area
  ["name"="Jardín Botánico y Zoológico de Asunción"]->.a;          // Redirect result to ".a"
out body qt;
(
  node // all nodes in .a
    (area.a);
  way // all ways in .a
   (area.a);
);
out body qt;
>;
out skel qt;
