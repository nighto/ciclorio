var Google_API_key = "AIzaSyCreptOWN3UAF4LdXLNt6XzMuPAbEciJH0";
var GFTable = "1PJXmib36JCeDRrWiemp9v6dsNuL2MU4cD3kz8QY";
var initialLatLon = [-22.941,-43.396];
var initialZoomLevel = 11;
var mapData,     // object containing JSON response from Google Fusion Tables
    old_update,  // UTC date string of last update to compare with current one
    map,         // the leaflet map instance
    BicycleIcon, // IconClass to extend with colors
    bicycleColors = {}; // object to store bicycle icons.

$(document).ready(function(){
    initializeMap();
    checkLastUpdateMapData();
});

function initializeMap(){

    // initializing map zoomed out on the whole city
    map = L.map('map').setView(initialLatLon, initialZoomLevel);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://ta.org.br/">Transporte Ativo</a> e <a href="http://openstreetmap.org">OpenStreetMap</a>; Ícones <a href="http://mapicons.nicolasmollet.com/">MapIcons</a>'
    }).addTo(map);

    // defining geolocalization functions
    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        if(radius < 1000){
            L.marker(e.latlng).addTo(map)
                .bindPopup("Você está num raio de " + ~~radius + " metros deste ponto").openPopup();

            L.circle(e.latlng, radius).addTo(map);
        }
    }

    function onLocationError(e) {
        alert(e.message);
    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({setView: true, maxZoom: 16}); // don't get too close

    // defining map icon
    BicycleIcon = L.Icon.extend({
        options: {
            shadowUrl: 'img/cycling-shadow.png',
            iconSize:     [32, 37], // size of the icon
            shadowSize:   [51, 37], // size of the shadow
            iconAnchor:   [16, 34], // point of the icon which will correspond to marker's location
            shadowAnchor: [25, 36], // the same for the shadow
            popupAnchor:  [0, -16]  // point from which the popup should open relative to the iconAnchor
        }
    });

    bicycleColors.blue   = new BicycleIcon({iconUrl: 'img/cycling-blue.png'});
    bicycleColors.red    = new BicycleIcon({iconUrl: 'img/cycling-red.png'});
    bicycleColors.orange = new BicycleIcon({iconUrl: 'img/cycling-orange.png'});
};

function checkLastUpdateMapData(){
    var DRIVE_URL = "https://www.googleapis.com/drive/v2/files/"+GFTable+"?key="+Google_API_key;

    $.getJSON(DRIVE_URL, function(data){
        old_update = localStorage.getItem('mapDataLastUpdate');
        localStorage.setItem('mapDataLastUpdate', data.modifiedDate);
        updateMapData();
    });
};

function updateMapData(){
    // if no data or old data
    if(!localStorage.getItem('mapData') || old_update != localStorage.getItem('mapDataLastUpdate')){
        loadMapData();
    }else{
        // localStorage stores pairs key/value as string, should parse
        mapData = JSON.parse(localStorage.getItem('mapData'));
        processMapData(mapData);
    }
}

function loadMapData(){
    var query = "select * from "+GFTable;
    var escapedQuery = query.replace(/ /g, '+');
    var GFT_URL = "https://www.googleapis.com/fusiontables/v1/query?sql="+escapedQuery+"&key="+Google_API_key+"&jsoncallback=";

    console.log('loading map data');

    $.getJSON(GFT_URL, function(data){
        // localStorage stores pairs key/value as string, should parse
        localStorage.setItem('mapData', JSON.stringify(data));
        mapData = data;
        processMapData(mapData);
    });
};

function processMapData(mapData){
    // defining arrays to store the correspondent points and lines
    var biciPublica          = [];
    var bicicletario         = [];
    var oficina              = [];
    var ciclovia             = [];
    var ciclofaixa           = [];
    var calcadaCompartilhada = [];
    var viaCompartilhada     = [];

    for(var i=0, len=mapData.rows.length; i<len; i++){
        var rowType = mapData.rows[i][4];

        if(rowType === 'Bicicleta Publica'){
            biciPublica.push(mapData.rows[i]);
        } else if(rowType === 'Bicicletario'){
            bicicletario.push(mapData.rows[i]);
        } else if(rowType === 'Oficina de Bicicleta'){
            oficina.push(mapData.rows[i]);
        } else if(rowType === 'Ciclovia'){
            ciclovia.push(mapData.rows[i]);
        } else if(rowType === 'Ciclofaixa'){
            ciclofaixa.push(mapData.rows[i]);
        } else if(rowType === 'Faixa Compartilhada'){
            calcadaCompartilhada.push(mapData.rows[i]);
        } else if(rowType === 'Via Compartilhada'){
            viaCompartilhada.push(mapData.rows[i]);
        }
    }

    // defining layers with the pins and their colors
    var lBiciPublica  = addPins(biciPublica,  'orange');
    var lBicicletario = addPins(bicicletario, 'red');
    var lOficina      = addPins(oficina,      'blue');

    // defining layers with the lines and their colors
    var lCiclovia             = addLines(ciclovia, 'red');
    var lCiclofaixa           = addLines(ciclofaixa, 'green');
    var lCalcadaCompartilhada = addLines(calcadaCompartilhada, 'blue');
    var lViaCompartilhada     = addLines(viaCompartilhada, 'cyan');

    // adding them to the list of layers
    var overlayMaps = {
        "Bicicletas Públicas":     lBiciPublica,
        "Bicicletários":           lBicicletario,
        "Oficinas de Bicicleta":   lOficina,
        "Ciclovias":               lCiclovia,
        "Ciclofaixas":             lCiclofaixa,
        "Calçadas Compartilhadas": lCalcadaCompartilhada,
        "Vias Compartilhadas":     lViaCompartilhada
    };

    // and adding the list to map
    L.control.layers(null, overlayMaps).addTo(map);
};

function addPins(elements, color){
    var markerLayer = new L.ConditionalMarkers({
        minZoomShow: 11,
        viewportPadding: 0.0
    });
    markerLayer.addTo(map);

    for(var i=0, len=elements.length; i<len; i++){
        var lat   = elements[i][2].geometry.coordinates[1];
        var lon   = elements[i][2].geometry.coordinates[0];
        var title = elements[i][1];
        var text  = elements[i][0];
        var popupText = '<b>'+title+'</b><br>'+text;

        markerLayer.addLayer( L.marker( [lat, lon], {icon: bicycleColors[color]} ).bindPopup(popupText) );
    }

    return markerLayer;
}

function addLines(elements, color){
    var linesArray = [];

    for(var i=0, li=elements.length; i<li; i++){
        var latLonArray = [];
        var title = elements[i][1];
        var text = elements[i][0];
        var popupText = '<b>'+title+'</b><br>'+text;
        for (var j=0, lj=elements[i][2].geometry.coordinates.length; j<lj; j++){
            var lat = elements[i][2].geometry.coordinates[j][1];
            var lon = elements[i][2].geometry.coordinates[j][0];
            latLonArray.push([lat, lon]);
        }

        linesArray.push( L.polyline(latLonArray, {color:color}).bindPopup(popupText) );
    }

    console.log(color, linesArray);

    return L.layerGroup(linesArray).addTo(map);
}