'use strict';
/**
* @ngdoc directive
* @name yvyUiApp.directive:mapaLeaflet
* @description
* # mapaLeaflet
*/
angular.module('yvyUiApp')
.directive('mapaEstablecimientos', function (mapaEstablecimientoFactory, $timeout) {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      data:'=',
      filtro:'=',
      detalle:'=',
      periodo: '=',
      modal: '='
    },
    templateUrl: 'views/templates/template_mapa.html',
    link: function postLink(scope, element, attrs) {
      var tilesLoaded = function(){
        MECONF.tilesLoaded = true;
        finishedLoading();
      };

      /* Funcion que inicializa el mapa */
      var init_map = function() {

        startLoading();

        var layers = MECONF.LAYERS();

        var osm = layers.OPEN_STREET_MAPS.on('load', tilesLoaded);
        var mapQuestOPen  = layers.MAPQUEST.on('load', tilesLoaded);


        var map = L.map('map', {maxZoom: MECONF.zoomMax, minZoom: MECONF.zoomMin, worldCopyJump: true, attributionControl: false})
        .setView(mapaEstablecimientoFactory.getCentroZoo().geometry.coordinates, MECONF.zoomMin)
        .on('baselayerchange', startLoading);


        var geojson_data = mapaEstablecimientoFactory.getGeojson();
        MECONF.all_features = mapaEstablecimientoFactory.getGeojson();

        /* Agrega los puntos al mapa */
        geojson_data.then(function(features){
          L.geoJson(features, {pointToLayer: function(feature, latlng){
            return L.marker(latlng, {icon: get_custom_marker(feature) });
          }, style: function(feature) {

            return get_feature_format(feature);
          }, onEachFeature: onEachFeature,
          filter: function (feature, layer){

            if (feature.properties['natural'] == 'tree'){
              return false;
            }else if (feature.properties['waterway'] == 'drystream') {
              return false;
            }else if (feature.properties['tourism'] == 'camp_site') {
              return false;
            }else if (feature.id.indexOf('node/') != -1 ) {
              return false;
            }

            return true;
          } }).addTo(map);
          MECONF.geoJsonFeatures = features;

        });

        /**
        * Asigna un método en el onMarkerClick e invoca a una función para
        * agregar labels a los polígonos
        * @param feature del geoJson
        * @param layer del mapa
        */
        function onEachFeature(feature, layer){
          layer.on({
            click: showInfo
          });
        }

        var animalesList = [];
        mapaEstablecimientoFactory.getAnimales().then(function(animales) {
          animalesList = animales;
        });

        /**
        * Despierta el modal y coloca la información del animal
        * @param e feature del geojson
        */
        function showInfo(e){

          var foundAnimal = false;

          angular.forEach(animalesList, function(animal) {
            if(e.target.feature.id === animal.geojson_id) {
              scope.modal = animal;
              foundAnimal = true;
            }
          });
          scope.$apply();

          if(foundAnimal)
            $('#descripcion-modal').modal('show');
        }

        var baseMaps = {
          'Calles OpenStreetMap': osm,
          'Satelital': mapQuestOPen,
        };

        map.addLayer(osm);

        L.control.layers(baseMaps).addTo(map);


        return map;
      };

      /**
      * retorna el ícono personalizado dependiendo del feature
      * @param feature el punto del archivo geojson
      * @return AwesomeMarkers el ícono que se debe asignar al feature
      */
      function get_custom_marker(feature){
        var CLASS_ICON = 'glyphicon';
        var icon;
        var markerColor;

        switch (feature.properties['amenity']) {
          case 'bench':
          markerColor = 'pink';
          icon = 'screenshot';
          break;

          case 'waste_basket':
          markerColor = 'black';
          icon = 'trash';
          break;

          case 'drinking_water':
          markerColor = 'blue';
          icon = 'tint';
          break;

          default:
          markerColor = 'orange';
          icon = 'home';
          break;
        }

        return L.AwesomeMarkers.icon({
          icon: icon,
          markerColor: markerColor,
          prefix: CLASS_ICON
        });

      }

      /**
      * Función que dependiendo del zoom muestra o oculta las etiquetas de
      * las jaulas de los animales
      * labels a las jaulas de los animales
      * @param e feature del geojson
      */
      var set_labels_in_map = _.throttle(function (e){

        if (map.getZoom() >= MECONF.zoomMax){

          if (!flaw_layers) {
            /* si el zoom es el máximo y todavía no se cargarons los labels
            crea labels a los features de las jaulas*/

            var all_show_features = MECONF.all_features;
            var bounds = map.getBounds();

            all_show_features.then(function(ftrs){

              _.filter(ftrs.features, function(feature){
                var latLon = [feature.geometry.coordinates[1],
                feature.geometry.coordinates[0]];
                return bounds.contains(latLon);
              });

              _.each(ftrs.features, function(ftr){
                if (get_permitted_polygon(ftr)){
                  set_label(ftr);
                }
              });
            });

            flaw_layers = true;
          }

        }else{
          /* si el zoom no es el mmáximo remueve los labels */
          if (flaw_layers){

            map.eachLayer(function (layer) {
              if (typeof layer._icon != 'undefined'){
                if (layer._icon.className.indexOf('leaflet-label') > -1)
                map.removeLayer(layer);
              }
            });
            flaw_layers = false;

          }
        }
      }, 200);


      /**
      * Retorna si cumple o no la condición para que muestre el label
      * @param feature del geojson
      * @return boolean pertenece al polígono solicituado
      */
      function get_permitted_polygon(feature){
        try{
          return feature.geometry['type'] == 'Polygon' &&
          feature.properties['tourism'] == 'attraction';
        }catch(e){
          return false;
        }

      }

      /**
      * Setea en el label la propiedad del NAME feature
      * @param feature del geojson
      */
      function set_label(feature){

        var polygon = L.polygon(feature.geometry.coordinates);
        if (typeof feature.properties['name'] != 'undefined'){

          var lnglat = polygon.getBounds().getCenter();

          /*
          * Invierte los valores de latitud y longitud porque la
          * ubicación geográfica es opuesta a la notación LatLong
          * y por alguna razón cuando el marker recibe el valor lo
          * espera conforme a la notación LatLong, contrario a lo que
          * sucede cuando se carga el mapa.
          *
          * Se crea la variable temporal, porque la función espera un objeto
          * del tipo latlng no las coordenadas solamente
          */
          var temp = lnglat.lat;
          lnglat.lat = lnglat.lng;
          lnglat.lng = temp;

          L.marker(lnglat, {
            icon: L.divIcon({
              className: 'leaflet-label',
              html: feature.properties['name'],
              iconSize: [100, 40]
            })
          }).addTo(map)
        }
      }

      /**
      * Función que retorna un objeto con las propiedades del formato que
      * debe tener según el tipo de feature
      * @param feature objeto del geojson
      * @return JSON object {color, fillColor, weight}
      */
      function get_format(feature){
        if (typeof feature.properties['amenity'] != 'undefined'){
          switch (feature.properties['amenity']) {
            case 'parking':
            return PARKING_FORMAT;
            break;
            case 'toilets':
            return TOILETS_FORMAT;
            break;
            case 'water_point':
            return WATER_POINT_FORMAT;
            break;
            default:
            break;
          }
        }else if (typeof feature.properties['tourism'] != 'undefined') {
          switch (feature.properties['tourism']) {
            case 'attraction':
            return CAGES_FORMAT;
            break;
            case 'zoo':
            return ZOO_FORMAT;
            default:
            break;
          }
        }else if (typeof feature.properties['natural'] != 'undefined') {
          switch (feature.properties['natural']) {
            case 'wood':
            case 'grassland':
            case 'tree':
            case 'tree_row':
            return  GREEN_AREA_FORMAT;
            break;

            case 'water':
            return WATER_POINT_FORMAT;
            break;
            default:
            break;
          }
        }else if (typeof feature.properties['landuse'] != 'undefined') {
          switch (feature.properties['landuse']) {
            case 'grass':
            case 'meadow':
            return GREEN_AREA_FORMAT;

            default:
            break;
          }
        }else if (typeof feature.properties['building'] != 'undefined') {
          switch (feature.properties['building']) {
            case 'school':
            case 'yes':
            case 'public':
            return BUILDING_FORMAT;

            break;
            default:
            break;
          }
        }else if (typeof feature.properties['highway'] != 'undefined') {
          switch (feature.properties['highway']) {
            case 'rest_area':
            return REST_AREA_FORMAT;
            break;

            case 'path':
            case 'footway':
            case 'road':
            return SECONDARY_ROAD_FORMAT;
            break;

            case 'service':
            case 'unclassified':
            return PRIMARY_ROAD_FORMAT;
            default:
            break;
          }
        } else if (typeof feature.properties['barrier'] != 'undefined') {
          return WALL_FORMAT;
        }else if (typeof feature.properties['attraction'] != 'undefined') {
          switch (feature.properties['highway']) {
            case 'animal':
            return BUILDING_FORMAT;
            break;
            default:
            break;
          }
        }

        return {
          color: '#ff0000',
          fillColor: '#ff0000',
          weight: 4
        }

      }

      /**
      * Función que retorna el formato del feature
      * @param feature del geojson
      * @return objeto para el formato del feature
      */
      function get_feature_format(feature){

        var format = get_format(feature);

        return {
          color: format.color,
          fillColor: format.fillColor,
          weight: format.weight,
          fillOpacity: FILL_DEFAULT_OPACITY,
          dashArray: '3',
          opacity: 1,
          html: 'cualquier cosa'
        };
      }

      //Funcion que inicializa el Spinner (Loading)
      var startLoading = function() {
        var spinner = new Spinner({
          color: "#ffb885",
          radius: 10,
          width: 5,
          length: 10,
          top: '92%',
          left: '98%'
        }).spin();
        $("#map").append(spinner.el);
      };


      //Funcion que finaliza el Spinner (Loading)
      var finishedLoading = function() {

        if(MECONF.tilesLoaded){
          $(".spinner").remove();
          MECONF.tilesLoaded = false;
        }

      };

      var draw_markers = function(){
        var geoJson = L.geoJson();


        MECONF.geoJsonLayer = geoJson; //Sobre esta variable se aplican los filtros
        MECONF.geoJsonLayer.on('mouseover', function(e){
        });

        MECONF.geoJsonLayer.addTo(map);
        map.on('move', set_labels_in_map);

      }

      /******************************** INICIO **************************************/

      /*
      * Variables para definición de formatos
      */

      var CAGES_FORMAT = {color: '#fff', fillColor: '#6f4e37', weight: 3};
      var REST_AREA_FORMAT = {color: '#f09109', fillColor: '#f09109', weight: 3};
      var PARKING_FORMAT = {color: '#ff0000', fillColor: '#ff0000', weight: 3};
      var TOILETS_FORMAT = {color: '#0b3b0b', fillColor: '#0b3b0b', weight: 3};
      var WATER_POINT_FORMAT = {color: '#1c86c6', fillColor: '#1c86c6', weight: 3};
      var ZOO_FORMAT = {color: '#079109', fillColor: '#079109', weight: 5};
      var GREEN_AREA_FORMAT = {color: '#079109', fillColor: '#079109', weight: 3};
      var BUILDING_FORMAT = {color: '#900c3f', fillColor: '#900c3f', weight: 3};
      var SECONDARY_ROAD_FORMAT = {color: '#aba8a4', fillColor: '#aba8a4', weight: 3};
      var PRIMARY_ROAD_FORMAT = {color: '#8c8a87', fillColor: '#8c8a87', weight: 5};
      var WALL_FORMAT = {color: '#61210b', fillColor: '#61210b', weight: 3};
      var FILL_DEFAULT_OPACITY = '0.3';

      var flaw_layers = false;
      //Detalles de la configuracion del mapa
      var MECONF = MECONF || {};
      MECONF.tilesLoaded = false;
      MECONF.zoomMin = 17; // Se define el zoom inicial del mapa
      MECONF.zoomMax = 20; // Se define el zoom máximo del mapa

      /**
      * This function returns a JSON object with the tileLayer providers
      * in this version just OpenStreetMaps is used, but any other tileLayer
      * provider can be added
      *
      * @returns {{OPEN_STREET_MAPS}}
      * @constructor
      */
      MECONF.LAYERS = function () {
        var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 3});
        var MapQuestOpen_Aerial = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
          type: 'sat',
          ext: 'jpg',
          attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
          subdomains: '1234'
        });
        return {
          OPEN_STREET_MAPS: osm,
          MAPQUEST: MapQuestOpen_Aerial,
        }
      };

      var establecimientos;
      var map = init_map();
      draw_markers();
    }
  };
});
