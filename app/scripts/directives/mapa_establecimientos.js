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
        L.Control.Cobertura = L.Control.extend({
          options: {
            // topright, topleft, bottomleft, bottomright
            position: 'topright',
            checked: false
          },
          initialize: function (options) {
            L.Util.setOptions(this, options);
          },
          onAdd: function (map) {
            var self = this;
            var container = L.DomUtil.create('div', 'leaflet-control-cobertura');
            this.form = L.DomUtil.create('form', 'form-inline', container);
            this.form.setAttribute('onsubmit', 'return false');
            var group = L.DomUtil.create('div', 'input-group', this.form);
            var prefix = L.DomUtil.create('span', 'input-group-addon coverage-icon', group);
            prefix.setAttribute('data-toggle', 'tooltip');
            prefix.setAttribute('data-placement', 'bottom');
            prefix.setAttribute('title', 'Con este control puedes visualizar la cobertura del establecimiento educativo seleccionado o la de todos los establecimientos visibles');
            //prefix.textContent = 'Cobertura:'
            this.input = L.DomUtil.create('input', 'form-control input-sm', group);
            this.input.setAttribute('min', '0');
            this.input.type = 'number';
            this.input.setAttribute('ng-model', 'data');
            var group2 = L.DomUtil.create('div', 'input-group', this.form);
            this.toggle = L.DomUtil.create('input', 'form-control input-sm', group2);

            $(this.toggle).bootstrapToggle({
              on: 'Todos',
              off: 'Uno'
            });
            this.toggle.type = 'checkbox';
            this.toggle.checked = this.options.checked;
            this.checked = this.options.checked;
            this.proxiedToggleChange = function(e){ self.toggleChange.call(self, e); }
            $(this.toggle).on('change', this.proxiedToggleChange);

            //var postfix = L.DomUtil.create('span', 'input-group-addon', group);
            //postfix.textContent = 'metros'
            this.debouncedChange = _.debounce(this.onChange, 300);
            this.debouncedDblClick = _.debounce(this.onDblClick, 300)
            L.DomEvent.addListener(this.input, 'change', this.debouncedChange, this);
            L.DomEvent.addListener(this.form, 'dblclick', this.debouncedDblClick, this);
            this.userChangeFlag = false;
            return container;
          },
          onRemove: function (map) {
            L.DomEvent.removeListener(this.input, 'change', this.debouncedChange);
            L.DomEvent.removeListener(this.form, 'dblclick', this.debouncedDblClick);
          },
          onChange: function(e) {
            this.userChangeFlag = true;
            map.eachLayer(function(layer){
              if(layer instanceof L.Circle) layer.setRadius(e.target.value);
            });
          },
          toggleChange: function(e) {
            this.checked = e.target.checked;
            draw_map();
          },
          onDblClick: function(e) {
            map.doubleClickZoom.enable();
          },
          setValue: function(v) {
            this.userChangeFlag = false;
            this.input.value = v;
          },
          getValue: function() {
            return this.input.value;
          },
          lastChangeByUser: function() {
            return this.userChangeFlag;
          },
          generalCoverageEnabled: function() {
            return this.checked;
          }
        });

        L.control.cobertura = function(id, options) {
          return new L.Control.Cobertura(id, options);
        }

        L.Control.Distancia = L.Control.extend({
          options: {
            // topright, topleft, bottomleft, bottomright
            position: 'topright',
            checked: false
          },
          initialize: function (options) {
            L.Util.setOptions(this, options);
          },
          onAdd: function (map) {
            var self = this;
            var container = L.DomUtil.create('div', 'leaflet-control-distancia');
            this.form = L.DomUtil.create('form', 'form', container);
            this.form.setAttribute('onsubmit', 'return false');
            /*var group = L.DomUtil.create('div', 'input-group', this.form);
            var prefix = L.DomUtil.create('span', 'input-group-addon distance-icon', group);
            prefix.setAttribute('data-toggle', 'tooltip');
            prefix.setAttribute('data-placement', 'bottom');
            prefix.setAttribute('title', 'Activando este control, puedes calcular la distancia entre dos establecimientos educativos');
            //prefix.textContent = 'Cálculo Distancia:'
            this.input = L.DomUtil.create('input', 'form-control input-sm', group);*/


            /*this.input.type = 'checkbox';
            this.input.checked = this.options.checked;
            this.value = this.options.checked;
            this.proxiedOnChange = function(e){ self.onChange.call(self, e); }
            $(this.input).on('change', this.proxiedOnChange);
            L.DomEvent.addListener(this.form, 'dblclick', this.onDblClick, this);*/
            return container;
          },
          onRemove: function (map) {
            $(this.input).off('change', this.proxiedOnChange);
            L.DomEvent.removeLbtn-groupistener(this.form, 'dblclick', this.onDblClick);
          },
          onChange: function(e) {
            this.value = e.target.checked;
          },
          onDblClick: function(e) {
            map.doubleClickZoom.enable();
          },
          getValue: function(){
            return this.value;
          }
        });

        L.control.distancia = function(id, options) {
          return new L.Control.Distancia(id, options);
        }


        var invalidateSize = function(animate){ map.invalidateSize(animate); };

        $('#map').data('right-sidebar-visible', false);


        /* El watch nos permitira filtrar los establecimientos (y por consiguiente, los respectivos Markers) */
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
            removePolygons();
          });

          detailSidebar.on('hidden', function(){
            MECONF.infoBox.update(MECONF.establecimientosVisibles.features);
            draw_map();
          });

          detailSidebar.on('show', function(){
            map.panTo(MECONF.fixedMarker.getLatLng());
          });

          detailSidebar.on('shown', function(){
            draw_map();
          });
        });

        /* Funcion que reduce la lista de establecimientos acorde al filtro seleccionado */
        var filtrar_establecimientos = function(establecimientos, filtro){
          var e =
          { 'type' : 'FeatureCollection',
            'features' : []
          };
          $.each(establecimientos.features, function(index, value){
            if (filtro.eval(value.properties[filtro.atributo])){
              e.features.push(value);
            }
          });
          return e;
        };

        /* Funcion que inicializa el mapa */
        var init_map = function() {

          startLoading();

          L.mapbox.accessToken = 'pk.eyJ1IjoicnBhcnJhIiwiYSI6IkEzVklSMm8ifQ.a9trB68u6h4kWVDDfVsJSg';
          var layers = MECONF.LAYERS();
          var mapbox = layers.MAPBOX.on('load', tilesLoaded);
          var osm = layers.OPEN_STREET_MAPS.on('load', tilesLoaded);
          var mapQuestOPen  = layers.MAPQUEST.on('load', tilesLoaded);


          var map = L.map('map', {maxZoom: MECONF.zoomMax, minZoom: MECONF.zoomMin, worldCopyJump: true, attributionControl: false})
                  .setView(mapaEstablecimientoFactory.getCentroZoo().features[0].geometry.coordinates, MECONF.zoomMin)
                  .on('baselayerchange', startLoading);


          var geojson_data = mapaEstablecimientoFactory.getGeojson();

          geojson_data.then(function(features){
            L.geoJson(features).addTo(map);
          });

          var baseMaps = {
              'Calles OpenStreetMap': osm,
              'Terreno': mapbox,
              'Satelital': mapQuestOPen,
          };

          L.polyline([[0, 0], ]).addTo(map);
          map.addLayer(osm);



          /*Controles que después tenemos que quitar*/
          L.control.layers(baseMaps).addTo(map);
          MECONF.controlCobertura = L.control.cobertura('control-cobertura');
          map.addControl(MECONF.controlCobertura);
          MECONF.controlDistancia = L.control.distancia('control-distancia');
          map.addControl(MECONF.controlDistancia);
          $('[data-toggle="tooltip"]').tooltip();
          /* ************************************ */

          //si el doble click ocurre en un control
          map.on('dblclick', function(e){
            if(e.originalEvent.target.id !== 'map' && e.originalEvent.target.tagName !== 'svg'){
              map.doubleClickZoom.disable();
            }
          });
          return map;
        };

        var getMarkerClass = function(feature){
          var clazz = 'm1';
          if(feature.properties.cantidad > 9) clazz = 'm2';
          if(feature.properties.cantidad > 99) clazz = 'm3';
          if(feature.properties.cantidad > 999) clazz = 'm4';
          return clazz;
        }

        var draw_markers = function(){
          var geoJson = L.mapbox.featureLayer();

          geoJson.on('layeradd', function (e) {
            var content, icon, color, marker = e.layer,
                    feature = marker.feature;

            if (feature.properties['periodo'] || feature.properties.cantidad === 1) {
              color = 'orange';
              icon = L.AwesomeMarkers.icon({
                icon: 'home',
                markerColor: color,
                prefix: 'glyphicon'
              });
            }else if(feature.properties.cantidad > 1){
              content = sprintf('<div>%s</div>', feature.properties.cantidad);
              icon = L.divIcon({
                className: getMarkerClass(feature),
                html: content
              });
            }
            marker.setIcon(icon);
          });

          MECONF.infoBox = draw_info_box();
          MECONF.infoBox.addTo(map);

          MECONF.geoJsonLayer = geoJson; //Sobre esta variable se aplican los filtros

          MECONF.geoJsonLayer.on('click', onMarkerClick);

          MECONF.geoJsonLayer.on('mouseover', function(e){
            /* Vamos a ver si nosotros usamos ésto */
            var features, properties = e.layer.feature.properties;
            if(properties['periodo'] || properties.cantidad === 1){ //Hover para un solo establecimiento
              //nothing to do
            }else if(properties.cantidad && !properties.nombre_departamento && !properties.nombre_distrito && !properties.nombre_barrio_localidad){
              MECONF.infoBox.update();
            }else{
              features = _.filter(MECONF.establecimientosVisibles.features, function(n) {
                var result = _.deburr(n.properties['nombre_departamento']) == _.deburr(properties.nombre_departamento);
                if(properties.nombre_distrito){ result = result && _.deburr(n.properties['nombre_distrito']) == _.deburr(properties.nombre_distrito); }
                if(properties.nombre_barrio_localidad){ result = result && _.deburr(n.properties['nombre_barrio_localidad']) == _.deburr(properties.nombre_barrio_localidad); }
                return result;
              });
              MECONF.infoBox.update(features);
            }
          });

          MECONF.geoJsonLayer.on('mouseout', function(e){
            var properties = e.layer.feature.properties;
            if(properties['periodo'] || properties.cantidad === 1){
              //nothing to do
            }else{
              MECONF.infoBox.update();
            }
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


          if(redrawClusters){
            e = getClusterByZoom(levelZoom);
          }else{
            e = MECONF.geoJsonLayer.getGeoJSON();
          }

          var afterFit = function(){ drawVisibleMarkers(e)};
          var outerBounds;

          if(redrawClusters){
            MECONF.infoBox.update(MECONF.establecimientosVisibles.features);
            if(filtros){
              MECONF.geoJsonLayer.setGeoJSON(e);
              outerBounds = MECONF.geoJsonLayer.getBounds();
              fitMap(map, outerBounds, maxZoom, afterFit);
              levelZoom = map.getZoom();
            }else{
              drawVisibleMarkers(e);
            }

            $timeout(function(){
              if(scope.distancia > 0){
                setDistancia();
                removePolygons(L.Polyline);
              }
            });

          }else{
            drawVisibleMarkers(e);
          }

          MECONF.currentZoom = levelZoom;
          return {map: map};
        };

        var drawVisibleMarkers = function(e){
          removePolygons(L.Circle);
          var bounds = map.getBounds();
          e.features = _.filter(MECONF.allFeatures, function(punto){
            var latLon = [punto.geometry.coordinates[1], punto.geometry.coordinates[0]];
            return bounds.contains(latLon);
          });

          MECONF.geoJsonLayer.setGeoJSON(e);
          if(MECONF.controlCobertura.generalCoverageEnabled()){
            _.each(e.features, function(f) {
              if(f.properties.cantidad === 1 || f.properties.codigo_establecimiento){
                var latLon = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
                L.circle(latLon, MECONF.controlCobertura.getValue(), {
                    color: 'blue',
                    fillOpacity: 0.5
                }).addTo(map);
              }
            });
          }else{
            drawDetailCoverage();
          }

          //MECONF.currentZoom = levelZoom;
        }

        var getClusterByZoom = function(levelZoom){
          var e;
          if(levelZoom < MECONF.nivelesZoom['pais']){
            e = mapaEstablecimientoFactory.getCantidadEstablecimientos('pais', MECONF.establecimientosVisibles);
          } else if (levelZoom < MECONF.nivelesZoom['departamento']) { //cluster por departamento (por defecto)
            e = mapaEstablecimientoFactory.getCantidadEstablecimientos('departamento', MECONF.establecimientosVisibles);
          } else if ((levelZoom >= MECONF.nivelesZoom['departamento'] && levelZoom < MECONF.nivelesZoom['distrito'])) { //cluster por distrito
            e = mapaEstablecimientoFactory.getCantidadEstablecimientos('distrito', MECONF.establecimientosVisibles);
          } else if ((levelZoom >= MECONF.nivelesZoom['distrito'] && levelZoom < MECONF.nivelesZoom['barrio_localidad'])) { //cluster por barrio/localidad
            e = mapaEstablecimientoFactory.getCantidadEstablecimientos('barrio_localidad', MECONF.establecimientosVisibles);
          }else{
            e = _.clone(MECONF.establecimientosVisibles);
          }
          MECONF.allFeatures = e.features;
          return e;
        }

        /* Funcion que filtra el cluster a mostrar, ya sea por Departamentos/Distritos/BarrioLocalidad */
        var filtrar_cluster = function(tipo){
          var clusterPais;
          if(tipo === 'pais'){
            clusterPais = mapaEstablecimientoFactory.getCentroPais();
            clusterPais.features[0].properties.cantidad = MECONF.establecimientosVisibles.features.length;
            return clusterPais;
          }

          var tipo_cluster = 'cluster_'+tipo;
          //Reemplazar por llamada al service
          //build a cluster index
          var clusterIndex = mapaEstablecimientoFactory.getClusterIndex(tipo_cluster);
          var coordinatesIndex = {};

          var e =
          { 'type' : 'FeatureCollection',
            'features' : []
          };

          var keyAccesor;
          switch(tipo){
            case 'departamento':
              keyAccesor = function(f){ return _.deburr(f.properties['nombre_departamento']); };
              break;
            case 'distrito':
              keyAccesor = function(f){ return _.deburr(f.properties['nombre_departamento']) + _.deburr(f.properties['nombre_distrito']); };
              break;
            case 'barrio_localidad':
              keyAccesor = function(f){ return _.deburr(f.properties['nombre_departamento']) + _.deburr(f.properties['nombre_distrito']) + _.deburr(f.properties['nombre_barrio_localidad']); };
              break;
          }

          _.each(MECONF.establecimientosVisibles.features, function(f){
            var key = keyAccesor(f);
            if(clusterIndex[key]){
              clusterIndex[key].properties.cantidad++;
              coordinatesIndex[key] = f.geometry.coordinates;
              //clusterIndex[key].properties.targetChild = f;
            }
          });

          /* Si el cluster es de un elemento, se desplaza su centro:
             Del centroide del poligono al punto del unico establecimiento del cluster
          */
          _.forOwn(clusterIndex, function(c, k){
            if(c.properties.cantidad === 1){
              c.geometry.coordinates = coordinatesIndex[k];
            }
          });

          e.features = _(clusterIndex).values().filter(function(f){ return f.properties.cantidad; }).value();
          return e;

        };

        function removePolygons(clazz){
          clazz =  clazz || L.Path;
          map.eachLayer(function(layer) {
            if(layer instanceof clazz) map.removeLayer(layer);
          });
        }

        function drawDetailCoverage() {
          var latLon;
          if(MECONF.fixedMarker){
            L.circle(MECONF.fixedMarker.getLatLng(), MECONF.controlCobertura.getValue(), {
              color: 'blue',
              fillOpacity: 0.5
            }).addTo(map);
          }
        }

        /* Handler para el click de un marker */
        function onMarkerClick(t) {
          var target = t.layer;

          var feature = (target.feature.properties.cantidad === 1) ? mapaEstablecimientoFactory.getClusterElementChild(target.feature, MECONF.establecimientosVisibles) : target.feature;

          var levelZoom = map.getZoom();
          var latLon, targetChild, targetZoom;
          var icon, color, lineGeoJSON, latLonA, latLonB;
          if(feature.properties['periodo']){ //Verificamos que se trata de un establecimiento
            //Si ya hay un establecimiento seleccionado y esta habilitado el control de distancia
            if(MECONF.fixedMarker && MECONF.controlDistancia.getValue() && detailSidebar.isVisible()){
              scope.$apply(function(){
                removePolygons(L.Polyline);
                latLonA = MECONF.fixedMarker.getLatLng();
                latLonB = target.getLatLng();
                var polyline = L.polyline([latLonA, latLonB]).addTo(map);
                scope.distancia = Math.round(latLonA.distanceTo(latLonB));
              });
            }else{
              if(scope.distancia > 0) { setDistancia(); }
              removePolygons();
              MECONF.fixedMarker = target;
              //Cambiamos el radio respecto al zoom hasta que el usuario haga un cambio sobre el control
              if(!MECONF.controlCobertura.lastChangeByUser()){
                MECONF.controlCobertura.setValue(Math.pow(19 - levelZoom, 2) * 10);
              }
              if(detailSidebar.isVisible()){
                map.panTo(MECONF.fixedMarker.getLatLng());
              }
              drawDetailCoverage();
              $timeout(function(){
                scope.$apply(function(){
                  scope.detalle = feature.properties;
                });
                MECONF.infoBox.update(feature);
              });
            }
          }else{
            removePolygons();
            targetZoom = _.find(_.values(MECONF.nivelesZoom), function(z){ return z > levelZoom; });
            targetChild = mapaEstablecimientoFactory.getClusterElementChild(target.feature, MECONF.establecimientosVisibles);
            latLon = [targetChild.geometry.coordinates[1], targetChild.geometry.coordinates[0]];
            map.setView(latLon, targetZoom); //funcion que centra el mapa sobre el marker
          }

        }

        /* Funcion que dibuja el resumen de los establecimientos */
        function draw_info_box() {
          var info = L.control();

          info.onAdd = function (map) {
              this._div = L.DomUtil.create('div', 'info-box'); // create a div with a class "info"
              this.update();
              return this._div;
          };

          // method that we will use to update the control based on feature properties passed
          info.update = function (f) {
              var msg = this._div.innerHTML;
              if (f instanceof Array) { //Cuando se hace hover sobre un Marker de Cluster
                msg = get_summary_message(f);
              } else if (f) {  //Cuando es hace el popup de un Marker
                msg = sprintf('Mostrando un establecimiento<br/>del departamento %s,<br/>del distrito %s,<br/>de la localidad %s',
                          f.properties['nombre_departamento'], f.properties['nombre_distrito'], f.properties['nombre_barrio_localidad']);
              }else if(typeof f === 'undefined'){ //Primera vez
                if(MECONF.establecimientosVisibles){
                  msg = get_summary_message(MECONF.establecimientosVisibles.features);
                }else{
                  //nothing to do
                }
              }

              this._div.innerHTML = msg;
          };

          return info;
        }

        function get_summary_message(features) {
          var cantidadDepartamentos = _(features)
              .map(function (f) {
                  return f.properties['nombre_departamento'];
              })
              .filter(function(e){ return e !== 'ASUNCION';})
              .unique().value().length;

          var cantidadDistritos = _(features)
              .map(function (f) {
                  return f.properties['nombre_distrito'];
              })
              .unique().value().length;

          var cantidadBarriosLocalidaes = _(features)
              .map(function (f) {
                  return f.properties['nombre_barrio_localidad'];
              })
              .unique().value().length;

          if (cantidadDepartamentos === 0) {
              cantidadDepartamentos += 1;
          }

          var cantidadEstablecimientos = _(features)
            .map(function (f){
              return f.properties['codigo_establecimiento'];
            })
            .unique().value().length;

          var establecimientosLabel = cantidadEstablecimientos > 1 ? 'establecimientos' : 'establecimiento';
          var departamentoLabel = cantidadDepartamentos > 1 ? 'departamentos' : 'departamento';
          var distritoLabel = cantidadDistritos > 1 ? 'distritos' : 'distrito';
          var barrioLocalidadLabel = cantidadBarriosLocalidaes > 1 ? 'localidades' : 'localidad';

          return sprintf('%s %s de %s %s, %s %s y %s %s',
                  cantidadEstablecimientos, establecimientosLabel, cantidadDepartamentos, departamentoLabel,
                  cantidadDistritos, distritoLabel, cantidadBarriosLocalidaes, barrioLocalidadLabel);
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

          if(tilesLoaded && establecimientos){
            $(".spinner").remove();
            MECONF.tilesLoaded = false;
          }

        };

        var tilesLoaded = function(){
          MECONF.tilesLoaded = true;
          finishedLoading();
        }

        //Configuracion del Gmaps listener
        var setup_gmaps = function() {
          google.maps.event.addListenerOnce(this._google, 'tilesloaded', tilesLoaded);
        };

        /******************************** INICIO **************************************/

        //Detalles de la configuracion del mapa
        var MECONF = MECONF || {};
        MECONF.tilesLoaded = false;
        MECONF.zoomMin = 17; // Se define el zoom inicial del mapa
        MECONF.zoomMax = 20; // Se define el zoom máximo del mapa

        MECONF.LAYERS = function () {
            var mapbox = L.tileLayer(
                    'http://api.tiles.mapbox.com/v4/rparra.jmk7g7ep/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnBhcnJhIiwiYSI6IkEzVklSMm8ifQ.a9trB68u6h4kWVDDfVsJSg');
            var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: 3});
            var MapQuestOpen_Aerial = L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}', {
              	type: 'sat',
              	ext: 'jpg',
              	attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency',
              	subdomains: '1234'
              });
            return {
                MAPBOX: mapbox,
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

      }//link: function postLink(scope, element, attrs) {
    };
  });
