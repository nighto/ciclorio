var CloudMade_API_key = "ea7350f1880845eabc4585641710ea28";
var Google_API_key = "AIzaSyCreptOWN3UAF4LdXLNt6XzMuPAbEciJH0";
var GFTable = "1PJXmib36JCeDRrWiemp9v6dsNuL2MU4cD3kz8QY";
var mapData,     // object containing JSON response from Google Fusion Tables
    old_update,  // UTC date string of last update to compare with current one
    map,         // the leaflet map instance
    BicycleIcon; // IconClass to extend with colors

$(document).ready(function(){
    initializeMap();
    checkLastUpdateMapData();
});

function initializeMap(){

    // initializing map zoomed out on the whole city
    map = L.map('map').setView([-22.941,-43.396], 11);

    L.tileLayer('http://{s}.tile.cloudmade.com/'+CloudMade_API_key+'/997/256/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://ta.org.br/">Transporte Ativo</a> e <a href="http://openstreetmap.org">OpenStreetMap</a>, <a href="http://opendatacommons.org/licenses/odbl/">ODbL</a>, Imagens © <a href="http://cloudmade.com">CloudMade</a>; Ícones © <a href="http://mapicons.nicolasmollet.com/">MapIcons</a>'
    }).addTo(map);

    // defining geolocalization functions
    function onLocationFound(e) {
        var radius = e.accuracy / 2;

        L.marker(e.latlng).addTo(map)
            .bindPopup("Você está num raio de " + radius + " metros deste ponto").openPopup();

        L.circle(e.latlng, radius).addTo(map);
    }

    function onLocationError(e) {
        alert(e.message);
    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({setView: true, maxZoom: 16});

    // defining map icon
    BicycleIcon = L.Icon.extend({
        options: {
            shadowUrl: 'img/cycling-shadow.png',
            iconSize:     [32, 37], // size of the icon
            shadowSize:   [51, 37], // size of the shadow
            iconAnchor:   [16, 34], // point of the icon which will correspond to marker's location
            shadowAnchor: [25, 36],  // the same for the shadow
            popupAnchor:  [0, -16] // point from which the popup should open relative to the iconAnchor
        }
    });
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
    var biciPublica = [];
    var bicicletario = [];
    var oficina = [];
    
    for(var i=0, len=mapData.rows.length; i<len; i++){
        if(mapData.rows[i][4] == "Bicicleta Publica")
            biciPublica.push(mapData.rows[i]);
        else if(mapData.rows[i][4] == "Bicicletario")
            bicicletario.push(mapData.rows[i]);
        else if(mapData.rows[i][4] == "Oficina de Bicicleta")
            oficina.push(mapData.rows[i]);
    }

    var lBiciPublica  = addPins(biciPublica,  'orange');
    var lBicicletario = addPins(bicicletario, 'red');
    var lOficina      = addPins(oficina,      'blue');

    var overlayMaps = {
        "Bicicletas Públicas":   lBiciPublica,
        "Bicicletários":         lBicicletario,
        "Oficinas de Bicicleta": lOficina
    };

    L.control.layers(null, overlayMaps).addTo(map);
};

function addPins(elements, color){
    // defining an empty array to fill with markers
    var markerArray = [];

    for(var i=0, len=elements.length; i<len; i++){
        var lat   = elements[i][2].geometry.coordinates[1];
        var lon   = elements[i][2].geometry.coordinates[0];
        var title = elements[i][1];
        var text  = elements[i][0];
        var popupText = '<b>'+title+'</b><br>'+text;

        var elementIcon = new BicycleIcon({iconUrl: 'img/cycling-'+color+'.png'});

        // creating a marker for every point and pushing to the array
        markerArray.push( L.marker( [lat, lon], {icon: elementIcon} ).bindPopup(popupText) );
    }

    // returns the layer with all markers
    return L.layerGroup(markerArray);
}