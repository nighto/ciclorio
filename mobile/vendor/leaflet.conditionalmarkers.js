// Conditionally loads markers given a min and max zoom.
// Author: Ishmael Smyrnow
(function (window, undefined) {

  L.ConditionalMarkers = L.FeatureGroup.extend({

    _markers: [],
    _layer: null,

    options: {
      minZoomShow: 0,
      maxZoomShow: 99,
      viewportPadding: 1 // Percentage of viewport, [0-1.0]
    },

    initialize: function (options) {
      L.Util.setOptions(this, options);
    },

    addLayer: function (layer) {
      this._markers.push(layer);
      this._update();
    },

    removeLayer: function (layer) {
      var markerIndex;

      for (var i = 0; i < this._markers.length; i++) {
        if (this._markers[i] == layer) {
          markerIndex = i;
          break;
        }
      }

      if (typeof markerIndex !== 'undefined') {
        this._markers.splice(markerIndex, 1);
        this._layer.removeLayer(layer);
      }
    },

    onAdd: function (map) {
      this._map = map;
      var self = this;

      map.on("moveend", function (e) { self._update.call(self, e); });
      map.on("zoomend", function (e) { self._update.call(self, e); });

      // Add layer to the map
      this._layer = new L.FeatureGroup();
      this._map.addLayer(this._layer);

      L.FeatureGroup.prototype.onAdd.call(this, map);
    },

    _update: function (e) {
      // Perform updates to markers on map
      var zoom = this._map.getZoom();

      if (zoom >= this.options.minZoomShow && zoom <= this.options.maxZoomShow) {
        this._addMarkers();
        this._cleanupMarkers();
      } else {
        this._removeMarkers();
      }
    },

    _addMarkers: function () {
      // Add select markers to layer; skips existing ones automatically
      var i, marker;

      var markers = this._getMarkersInViewport(this._map);

      for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        this._layer.addLayer(marker);
      }
    },

    _removeMarkers: function () {
      this._layer.clearLayers();
    },

    _cleanupMarkers: function () {
      // Remove out-of-bounds markers
      // Also keep those with popups or in expanded clusters
      var bounds = this._map.getBounds().pad(this.options.viewportPadding);

      this._layer.eachLayer(function (marker) {
        if (!bounds.contains(marker.getLatLng()) && (!marker._popup || !marker._popup._container)) {
          this._layer.removeLayer(marker);
        }
      }, this);
    },

    _getMarkersInViewport: function (map) {
      var markers = [],
        bounds = map.getBounds().pad(this.options.viewportPadding),
        i,
        marker;

      for (i = 0; i < this._markers.length; i++) {
        marker = this._markers[i];
        if (bounds.contains(marker.getLatLng())) {
          markers.push(marker);
        }
      }

      return markers;
    }

  });

  L.conditionalMarkers = function (markers, options) {
    return new L.ConditionalMarkers(markers, options);
  };

} (this));