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
        periodo: '='
      },
      templateUrl: 'views/templates/template_mapa.html',
      link: function postLink(scope, element, attrs) {
        var detailSidebar, filterSidebar, filterFlag = false;

        $('#map').data('right-sidebar-visible', false);

        /* El watch nos permitira filtrar los establecimientos (y por consiguiente, los respectivos Markers) */
          /* TODO: Redefinir este método si necesitamos filtrar de alguna manera */
        scope.$watch('filtro', function(filtro){
          if(filtro){
            var establecimientos_visibles = establecimientos;
            $.each(filtro, function(index, value){
              establecimientos_visibles = filtrar_establecimientos(establecimientos_visibles, value);
            });
            MECONF.establecimientosVisibles = establecimientos_visibles;
            draw_map(filtro);
          }
        });

        var fitMap = function(map, bounds, zoom, callback){
          if(MECONF.geoJsonLayer.getLayers().length){
            if(filterFlag){
              map.off('move', updateMap);
              map.once('moveend', function(){ addUpdateHandlers(callback); });
              map.fitBounds(MECONF.geoJsonLayer.getBounds(), {maxZoom: zoom});
            }
            filterFlag = true;
          }else{
            map.setView([-24, -57.189], 7, {animate: true});
          }
        };

        var addUpdateHandlers = function(callback){
          //map.on('zoomend', updateMap);
          if(_.isFunction(callback)) callback();
          map.on('move', updateMap);
        };

        var setDistancia = function(){
          scope.$apply(function(){
            scope.distancia = 0;
          });
        };

        scope.$on('detail-ready', function(e, sidebar){
          map.addControl(sidebar);
          detailSidebar = sidebar;

          detailSidebar.on('hide', function(){
            if(scope.distancia > 0) { setDistancia(); }
            MECONF.fixedMarker = null;
            //removePolygons();
          });

          detailSidebar.on('hidden', function(){
            MECONF.infoBox.update(MECONF.establecimientosVisibles.features);
            draw_map();
          });

            // Descomentar en caso de querer centrar la vista en el elemento seleccionado
          //detailSidebar.on('show', function(){
          //  map.panTo(MECONF.fixedMarker.getLatLng());
          //});

          detailSidebar.on('shown', function(){
            draw_map();
          });
        });

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
                  .setView(mapaEstablecimientoFactory.getCentroZoo().features[0].geometry.coordinates, MECONF.zoomMin)
                  .on('baselayerchange', startLoading);


          var geojson_data = mapaEstablecimientoFactory.getGeojson();

          /**
           * Temporal function just for concept probe
           * @param feature
           * @returns {*}
             */
          var get_custom_marker = function(feature){
            var iconMarker;

            if (feature.properties['amenity'] === 'bench'){
              iconMarker= L.AwesomeMarkers.icon({
                icon: 'screenshot',
                markerColor: 'pink',
                prefix: 'glyphicon'
              });

            }else if (feature.properties['amenity'] == 'waste_basket'){
              iconMarker =  L.AwesomeMarkers.icon({
                icon: 'trash',
                markerColor: 'black',
                prefix: 'glyphicon'
              });
            }else{
              iconMarker =  L.AwesomeMarkers.icon({
                icon: 'home',
                markerColor: 'orange',
                prefix: 'glyphicon'
              });
            }

            return iconMarker;
          }

          /* Agrega los puntos al mapa */
          geojson_data.then(function(features){
            L.geoJson(features, {pointToLayer: function(feature, latlng){
              return L.marker(latlng, {icon: get_custom_marker(feature) });
            }, style: function(feature) {
              return get_feature_format(feature);
            }, onEachFeature: onEachFeature,
          filter: function (feature, layer){
            //console.log(feature.properties['natural']);

            if (feature.properties['natural'] == 'tree'){
              return false;
            }else if (feature.properties['waterway'] == 'drystream') {
              return false;
            }

            return true;
          } }).addTo(map);
              MECONF.geoJsonFeatures = features;

          });



          function onEachFeature(feature, layer){
            layer.on({
                click: whenClicked
            });
          }

          function whenClicked(e){
            console.log(e.target.feature.properties);
          }

          /**
          * Función que retorna un objeto con las propiedades del formato que
          * debe tener según el tipo de feature
          * @param feature objeto del geojson
          * @return JSON object {color, fillColor, weight}
          */
          function get_format(feature){
            //console.log(feature);
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

            //console.log(format);
            return {
              color: format.color,
              fillColor: format.fillColor,
              weight: format.weight,
              fillOpacity: FILL_DEFAULT_OPACITY,
              dashArray: '3',
              opacity: 1
            };
          }

          var baseMaps = {
              'Calles OpenStreetMap': osm,
              'Satelital': mapQuestOPen,
          };

          map.addLayer(osm);

          L.control.layers(baseMaps).addTo(map);

          /* ************************************ */

          //si el doble click ocurre en un control
          map.on('dblclick', function(e){
            if(e.originalEvent.target.id !== 'map' && e.originalEvent.target.tagName !== 'svg'){
              map.doubleClickZoom.disable();
            }
          });
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

        var draw_markers = function(){
          var geoJson = L.geoJson();

          geoJson.on('layeradd', function (e) {
            var content, icon, color, marker = e.layer,
                    feature = marker.feature;

            if (feature.properties['natural'] == 'tree'){
              color = 'green';
              icon = L.AwesomeMarkers.icon({
                icon: 'tree-deciduous',
                markerColor: color,
                prefix: 'glyphicon'
              });
            }
            if (feature.properties['periodo'] || feature.properties.cantidad === 1) {
              color = 'orange';
              icon = L.AwesomeMarkers.icon({
                icon: 'home',
                markerColor: color,
                prefix: 'glyphicon'
              });
            }else {
              color = 'red';
              icon = L.AwesomeMarkers.icon({
                icon: 'grain',
                markerColor: color,
                prefix: 'glyphicon'
              });
            }
            marker.setIcon(icon);
          });


          MECONF.geoJsonLayer = geoJson; //Sobre esta variable se aplican los filtros

          MECONF.geoJsonLayer.on('click', onMarkerClick);

          MECONF.geoJsonLayer.on('mouseover', function(e){
          });

          MECONF.geoJsonLayer.addTo(map);

          map.on('move', updateMap);

        }

        var updateMap = _.throttle(function(){ draw_map(); }, 200);

        /* Funcion que dibuja el mapa de acuerdo a los establecimientos filtrados y al zoom actual */
        var draw_map = function(filtros){
          var maxZoom, e, filterByDepartamento, filterByDistrito, filterByLocalidad, levelZoom = map.getZoom();
          MECONF.currentZoom = MECONF.currentZoom || levelZoom;
          var redrawClusters = filtros || levelZoom !== MECONF.currentZoom;

          if(filtros){
            filterByLocalidad = _.filter(filtros, function(f){ return f.atributo === 'nombre_barrio_localidad' && f.valor.length; }).length > 0;
            filterByDistrito = _.filter(filtros, function(f){ return f.atributo === 'nombre_distrito' && f.valor.length; }).length > 0 && !filterByLocalidad;
            filterByDepartamento = _.filter(filtros, function(f){ return f.atributo === 'nombre_departamento' && f.valor.length; }).length > 0 && !filterByDistrito;

            if(filterByDepartamento) maxZoom = MECONF.nivelesZoom['departamento'] - 1;
            if(filterByDistrito) maxZoom = MECONF.nivelesZoom['distrito'] - 1;
            if(filterByLocalidad) maxZoom = MECONF.nivelesZoom['barrio_localidad'] - 1;
            if(!filterByDepartamento && !filterByDistrito && !filterByLocalidad){
              maxZoom = MECONF.nivelesZoom['departamento'] - 1;
            }
            levelZoom = maxZoom;
          }

          //e = MECONF.geoJsonLayer.getGeoJSON();
          e = MECONF.geoJsonFeatures;

          drawVisibleMarkers(e);

          MECONF.currentZoom = levelZoom;
          return {map: map};
        };

        var drawVisibleMarkers = function(e){
          var bounds = map.getBounds();
          e.features = _.filter(MECONF.allFeatures, function(punto){
            var latLon = [punto.geometry.coordinates[1], punto.geometry.coordinates[0]];
            return bounds.contains(latLon);
          });

          MECONF.geoJsonfeatures = e;

          //MECONF.currentZoom = levelZoom;
        }


        /* Handler para el click de un marker */
        function onMarkerClick(t) {
          //TODO: Something need to be done here when a marker is clicked

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

          if(MECONF.tilesLoaded && establecimientos){
            $(".spinner").remove();
            MECONF.tilesLoaded = false;
          }

        };

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

        //Detalles de la configuracion del mapa
        var MECONF = MECONF || {};
        MECONF.tilesLoaded = false;
        MECONF.zoomMin = 17; // Se define el zoom inicial del mapa
        MECONF.zoomMax = 19; // Se define el zoom máximo del mapa

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

        MECONF.nivelesZoom = {pais: 6, departamento:11, distrito:14, barrio_localidad:17}; //niveles de zoom para departamento/distrito/barrioLocalidad

        var establecimientos;
        var map = init_map();
        draw_markers();

        scope.$watch('periodo', function(periodo) {
          if(periodo){
            mapaEstablecimientoFactory.getDatosEstablecimientos({ 'periodo': periodo }).then(function(value){
              establecimientos = value;
              finishedLoading();
            });
          }
        });

        scope.showFilter = function(){
          filterSidebar.show();
        }

      }
    };
  });
