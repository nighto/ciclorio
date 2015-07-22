$(document).ready(function(){

  $('#convert').on('click', function(){
    $('#lonlatalt').val('');

    var nodeUrl = 'http://api.openstreetmap.org/api/0.6/node/' + $('#nodeId').val();

    $.get(nodeUrl, function(data){
      var $node = $($($(data).children('osm')[0]).children('node')[0]);
      var lat = parseFloat($node.attr('lat')).toFixed(6);
      var lon = parseFloat($node.attr('lon')).toFixed(6);

      $('#lonlatalt').val('<Point><coordinates>'+lon+','+lat+',0.0</coordinates></Point>');
    });
  });

});