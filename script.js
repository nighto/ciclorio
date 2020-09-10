var initialLatLon = [-22.941, -43.396];
var initialZoomLevel = 11;
var mapData, // object containing JSON response from Google Fusion Tables
  old_update, // UTC date string of last update to compare with current one
  map, // the leaflet map instance
  BicycleIcon, // IconClass to extend with colors
  mapIcons = {}; // object to store bicycle icons.
var isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;


function initializeMap() {
  // initializing map zoomed out on the whole city
  map = L.map("map").setView(initialLatLon, initialZoomLevel);

  var mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY21kYWxiZW0iLCJhIjoiY2s0NzNyZTh3MDI4aTNubXgyOHo5MWI0bSJ9.HNUqwuZz-7GbfbBIdvZqYA';
  var osmUrl = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';

  L.tileLayer(
    // mapboxUrl,
    osmUrl,
    {
      // id: 'cmdalbem/cjgmxdewq002i2ro873yj3bt0',
      // id: 'cmdalbem/ck4741tmk0g1r1coadqbabugy',
      // id: 'mapbox/streets-v11',
      // id: 'mapbox/light-v9',
      maxZoom: 22,
      // tileSize: 512, // special for Mapbox Tiles
      // zoomOffset: -1, // special for Mapbox Tiles
      minZoom: 10,
      attribution:
        '&copy; <a href="http://ta.org.br/">Transporte Ativo</a> e <a href="http://openstreetmap.org">OpenStreetMap</a>; Ícones <a href="http://mapicons.nicolasmollet.com/">MapIcons</a>'
  }).addTo(map);

  map.on("locationerror", e => {
    console.error(e.message);
  });

  var lc = L.control.locate({
    locateOptions: {
      maxZoom: 16
    }
  }).addTo(map);
  // lc.start(); // disabled while we don't have HTTPS

  var BicycleIcon = L.Icon.extend({
    options: {
      // shadowUrl: "img/cycling-shadow.png",
      // shadowAnchor: [25, 36], // the same for the shadow
      // shadowSize: [51, 37], // size of the shadow
      iconSize: [32, 32], // size of the icon
      iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
      popupAnchor: [0, -16] // point from which the popup should open relative to the iconAnchor
    }
  });

  mapIcons.oficina = new BicycleIcon({ iconUrl: "img/oficina.png" });
  mapIcons.bicicletario = new BicycleIcon({ iconUrl: "img/bicicletario.png" });
  mapIcons.bikesharing = new BicycleIcon({ iconUrl: "img/bikesharing.png" });
}

function checkLastUpdateMapData() {
  var DRIVE_URL = "checkLastUpdate.json"; // formerly Google Drive API URL

  fetch(DRIVE_URL).then(function(response) {
    response.json().then(function(data) {
      old_update = localStorage.getItem("mapDataLastUpdate");
      localStorage.setItem("mapDataLastUpdate", data.modifiedDate);
      updateMapData();
    });
  });
}

function updateMapData() {
  // if no data or old data
  if (
    !localStorage.getItem("mapData") ||
    old_update != localStorage.getItem("mapDataLastUpdate")
  ) {
    loadMapData();
  } else {
    // localStorage stores pairs key/value as string, should parse
    mapData = JSON.parse(localStorage.getItem("mapData"));
    processMapData(mapData);
  }
}

function loadMapData() {
  var GFT_URL = "data.json"; // formerly Fusion Tables URL

  console.debug("loading map data");

  fetch(GFT_URL).then(function(response) {
    response.json().then(function(data) {
      // localStorage stores pairs key/value as string, should parse
      localStorage.setItem("mapData", JSON.stringify(data));
      mapData = data;
      processMapData(mapData);
    });
  });
}

function processMapData(mapData) {
  // defining arrays to store the correspondent points and lines
  var biciPublica = [];
  var bicicletario = [];
  var oficina = [];
  var ciclovia = [];
  var ciclofaixa = [];
  var calcadaCompartilhada = [];
  var viaCompartilhada = [];

  for (var i = 0, len = mapData.rows.length; i < len; i++) {
    var rowType = mapData.rows[i][4];

    if (rowType === "Bicicleta Publica") {
      biciPublica.push(mapData.rows[i]);
    } else if (rowType === "Bicicletario") {
      bicicletario.push(mapData.rows[i]);
    } else if (rowType === "Oficina de Bicicleta") {
      oficina.push(mapData.rows[i]);
    } else if (rowType === "Ciclovia") {
      ciclovia.push(mapData.rows[i]);
    } else if (rowType === "Ciclofaixa") {
      ciclofaixa.push(mapData.rows[i]);
    } else if (rowType === "Faixa Compartilhada") {
      calcadaCompartilhada.push(mapData.rows[i]);
    } else if (rowType === "Via Compartilhada") {
      viaCompartilhada.push(mapData.rows[i]);
    }
  }

  // defining layers with the pins and their colors
  var lBiciPublica = addPins(biciPublica, "bikesharing");
  var lBicicletario = addPins(bicicletario, "bicicletario");
  var lOficina = addPins(oficina, "oficina", { clusterize: false });

  // defining layers with the lines and their colors
  var lCiclovia = addLines(ciclovia, "red");
  var lCiclofaixa = addLines(ciclofaixa, "green");
  var lCalcadaCompartilhada = addLines(calcadaCompartilhada, "blue");
  var lViaCompartilhada = addLines(viaCompartilhada, "purple");

  function getLayerThumb(color) {
    return `
      <span style='
        width: 16px;
        height: 6px;
        background-color: ${color};
        display: inline-block;
        margin-right: 4px;
        margin-bottom: 2px;
        '></span>
    `; 
  }

  function getLayerCount(elements) {
    return `<span style="color: lightgray;">${elements.length}</span>`;
  }

  // adding them to the list of layers
  var overlayMaps = {
    [`${getLayerThumb('red')} Ciclovias ${getLayerCount(ciclovia)}`]: lCiclovia,
    [`${getLayerThumb('green')} Ciclofaixas ${getLayerCount(ciclofaixa)}`]: lCiclofaixa,
    [`${getLayerThumb('blue')} Calçadas Compartilhadas ${getLayerCount(calcadaCompartilhada)}`]: lCalcadaCompartilhada,
    [`${getLayerThumb('purple')} Vias Compartilhadas ${getLayerCount(viaCompartilhada)}`]: lViaCompartilhada,
    // [`<img src="img/bikesharing.png" style="width: 18px; height: 18px; margin-bottom: -5px;"/> Bicicletas Públicas ${getLayerCount(biciPublica)}`]: lBiciPublica,
    [`<img src="img/bicicletario.png" style="width: 18px; height: 18px; margin-bottom: -5px;"/> Bicicletários ${getLayerCount(bicicletario)}`]: lBicicletario,
    [`<img src="img/oficina.png" style="width: 18px; height: 18px; margin-bottom: -5px;"/> Oficinas de Bicicleta ${getLayerCount(oficina)}`]: lOficina
  };

  // and adding the list to map
  L.control.layers(null, overlayMaps, {
    collapsed: isMobile
  }).addTo(map);
}

function addPins(elements, type, options = {}) {
  var { isDefault=true, clusterize=true } = options;

  var markerLayer;
  if (clusterize) {
    markerLayer = L.markerClusterGroup({
      disableClusteringAtZoom: 16
    });
  } else {
    markerLayer = L.layerGroup();
  }

  for (var i = 0, len = elements.length; i < len; i++) {
    var lat = elements[i][2].geometry.coordinates[1];
    var lon = elements[i][2].geometry.coordinates[0];
    var title = elements[i][1];
    var text = elements[i][0];
    var popupText = "<b>" + title + "</b><br>" + text;

    markerLayer.addLayer(
      L.marker([lat, lon], { icon: mapIcons[type] }).bindPopup(popupText)
    );
  }

  if (isDefault) {
    markerLayer.addTo(map)
  }

  return markerLayer;
}

function addLines(elements, color, options = {}) {
  var { isDefault=true } = options;

  var linesArray = [];

  for (var i = 0, li = elements.length; i < li; i++) {
    var latLonArray = [];
    var title = elements[i][1];
    var text = elements[i][0];
    var popupText = "<b>" + title + "</b><br>" + text;
    for (
      var j = 0, lj = elements[i][2].geometry.coordinates.length;
      j < lj;
      j++
    ) {
      var lat = elements[i][2].geometry.coordinates[j][1];
      var lon = elements[i][2].geometry.coordinates[j][0];
      latLonArray.push([lat, lon]);
    }

    linesArray.push(
      L.polyline(latLonArray, { color: color }).bindPopup(popupText)
    );
  }

  console.debug(color, linesArray);

  if (isDefault) {
    return L.layerGroup(linesArray).addTo(map);
  } else {
    return L.layerGroup(linesArray);
  }
}

initializeMap();
checkLastUpdateMapData();