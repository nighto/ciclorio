$(document).ready(function(){

  var nodeArr = [];
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
  $('#convertWay').on('click', function(){
      $('#wayKml').val('');
      var wayUrl = 'http://api.openstreetmap.org/api/0.6/way/' + $('#wayId').val();
      $.get(wayUrl, function(data){
          var wayNode = $($($(data).children('osm')[0]).children('way')[0]);
          for(var i=0, len=wayNode[0].children.length; i<len; i++){
              var thisNode = wayNode[0].children[i];
              if(thisNode.nodeName == 'nd'){
                  nodeArr.push(thisNode.attributes[0].nodeValue);
              }
          }
          getNodeKMLOnArray(0);
      });
  });
  function getNodeKMLOnArray(index){
      if(nodeArr[index]){
          var nodeUrl = 'http://api.openstreetmap.org/api/0.6/node/' + nodeArr[index];
          $.get(nodeUrl, function(data){
              var $node = $($($(data).children('osm')[0]).children('node')[0]);
              var lat = parseFloat($node.attr('lat')).toFixed(6);
              var lon = parseFloat($node.attr('lon')).toFixed(6);
              nodeArr[index] = lon+','+lat+',0.0';
              var progressMsg = 'Aguarde, carregando';
              for (var i=0, l=index; i<l; i++){
                  progressMsg += '.';
              }
              $('#wayKml').val(progressMsg);
              getNodeKMLOnArray(index+1);
          });
      }else{
          var wayStr = '<LineString><coordinates>';
          for(var i=0, l=index; i<l; i++){
              wayStr += nodeArr[i] + ' ';
          }
          wayStr += '</coordinates></LineString>';
          $('#wayKml').val(wayStr);
      }
};

});