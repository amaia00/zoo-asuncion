# zoo-asuncion

Muestra en un mapa el zoológico de Asunción detallando las jaulas, estacionamiento, areas de descanso y demas sectores que se puedan encontrar en el zoológico

Esta aplicación se basa en [yvy-ui](https://github.com/CEAMSO/yvy-ui)

Mapa base.

Creado utilizando el Angular generator de Yeoman: https://github.com/yeoman/generator-angular

## Dependencias

  1. git
  2. nodejs
  3. npm
  4. [Compass](https://rubygems.org/gems/compass/)

## Desarrollo

  1. git clone https://github.com/amaianazabal/zoo-asuncion.git
  2. cd yvy-ui
  3. npm install
  4. bower install
  5. grunt serve
  6. Profit!

## Instalar nuevas dependencias

```bash
bower install --save [dependencia]
```

## Datos

Fueron obtenidos mapeando el zoológico y subiendo los datos a [OpenStreetMaps](https://www.openstreetmap.org/#map=15/-25.2497/-57.5668)

Se exportaron a [GeoJson](http://geojson.org/) utilizando [Overpass Turbo](http://overpass-turbo.eu/)
