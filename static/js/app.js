'use strict';
var app = angular.module('geophyzviz', 
	['mgcrea.ngStrap', 
	'ngAnimate',
	'angular-flexslider']);

app.config(['$interpolateProvider', function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[');
  $interpolateProvider.endSymbol(']}');
}]);



app.controller('controller', function ($scope, $http, $alert, $timeout) {


  // Get the data
  $http.get('/data').then(
    function(resp){

      $scope.vDPlot = initializeSeismic(resp.data.attr1,
                                        resp.data.attr2);
      $scope.drag = initializeDrag();
      var svg = $scope.vDPlot._plot.svg();
      $scope.cbar = initializeCBar(svg, resp.data.cbar1,resp.data.cbar2);
      $scope.svg = svg;
      $scope.scatterMatrix = initializeScatterMatrix(resp.data, svg);
      $scope.scatter = initializeScatter(svg, resp.data);
      
      $scope.attributes = resp.data.attributes;
      $scope.data = resp.data.data;

      $scope.dummy_text = svg.append("text");
    });

  var initializeSeismic = function(attr1, attr2){

    // Make the seismic plot
    var vDPlot = g3.plot("#container")
          .height(500)
          .xTitle("spatial cross-section")
          .yTitle("time [ms]")
          .width(500)
          .xTickFormat("")
          .x2TickFormat("")
          .y2TickFormat("")
          .margin(20,1200,1200,40)
	  .xDomain([0,50])
	  .yDomain([0,50])
          .draw();

    $scope.colorScale = d3.scale.linear()
      .range(['#FF0000', '#FFF', '#0000FF'])
      .domain([-50, 0, 50]);

    var data = colorScale(attr1, attr2);
    var vd = g3.seismic(vDPlot, data, [0,0]).draw();
    return vd;
  };

  var initializeScatter = function(canvas, data){

    canvas.append('g')
      .attr("id", 'scatter')
      .attr("transform", "translate(625,200)");
    
    // Make the first scatter plot
    var s1Plot = g3.plot('#scatter')
	  .height(275.0)
	  .xDomain([data.min.similarity,data.max.similarity])
	  .yDomain([data.min.amplitude, data.max.amplitude])
          .xTitle('similarity')
          .yTitle('amplitude')
	  .width(275)
	  .xTickFormat("")
	  .x2TickFormat("")
	  .y2TickFormat("")
	  .yTickFormat("")
	  .margin(20,40,40,40)
	  .draw();

    var scatter = g3.scatter(s1Plot, data.data).draw('similarity', 'amplitude');
    return scatter;
  };

  var initializeScatterMatrix = function(resp, canvas){


    var attributes = resp.attributes;
    var data = resp.data;
    var plots = [];

    var scopeFunc = function(primary_attr, secondary_attr){
      var prime = primary_attr;
      var second = secondary_attr;
      var updateScatter = function(){
	$scope.scatter._plot.yTitle(prime).xTitle(second)
          .xDomain([resp.min[primary_attr], resp.max[primary_attr]])
	  .yDomain([resp.min[secondary_attr], resp.max[secondary_attr]])
          .setScales();
	$scope.scatter.reDraw(prime, second);
        
	$scope.scatter._plot.getElement('xTitle').text(prime);
	$scope.scatter._plot.getElement('yTitle').text(second);
      };
      return updateScatter;
    };


    canvas.append('g')
      .attr("id", 'small_multiples')
      .attr("transform", "translate(700,0)");
    
    for(var i=0; i<attributes.length; i++){
      var secondary_attr = attributes[i];
      
      for(var j=1; j< attributes.length - i; j++){
	var primary_attr = attributes[i+j];
	var y2Title = "";
	var xTitle = "";
	var yMarg = 20;

	if(i===0){
	  xTitle = primary_attr;
	};
	if((i+j)===(attributes.length-1)){
	  y2Title = secondary_attr;
	  yMarg = 30;
	};

	var yPos = i * 60 + 20; 
	var xPos = (i + j) * 60 + 20;
	var plot =  g3.plot('#small_multiples')
	      .height(50)
	      .xDomain([resp.min[primary_attr], resp.max[primary_attr]])
	      .yDomain([resp.min[secondary_attr], resp.max[secondary_attr]])
	      .width(50)
	      .y2Title(y2Title)
	      .xTitle(xTitle)
	      .xTickFormat("")
	      .x2TickFormat("")
	      .y2TickFormat("")
	      .yTickFormat("")
	      .margin(yPos,20, yMarg, xPos)
	      .draw();
	
	plots.push(g3.scatter(plot, data).draw(primary_attr, 
					       secondary_attr));


	plot.svg().attr("cursor", "copy")
	  .on("click", scopeFunc(primary_attr, secondary_attr));

        
        plot.getElement('xTitle').attr("cursor", "grab")
          .data([primary_attr])
          .call($scope.drag);
        plot.getElement('y2Title').attr("cursor", "grab")
          .data([secondary_attr])
          .call($scope.drag);

	
      }
    }
    return plots;
  };


  var colorScale = function colorScale(attr1, attr2){

    var cmap = [];
    for(var i=1; i < attr1.length; i++){
      var row = [];
      for(var j=1; j < attr1[0].length; j++){
        
        var hsl = d3.hsl($scope.colorScale(attr1[i][j]));
        hsl.l = hsl.l * attr2[i][j];
        row.push(hsl.toString());
        
        
      }
      cmap.push(row);
    }
    return [cmap];
    };
    
  var cBarData = function initializeCbar(cmap1, cmap2){

    var cmap = [];
    for(var i=1; i < cmap1.length; i++){
      var row = [];
      for(var j=1; j < cmap2.length; j++){
        
        var hsl = d3.hsl($scope.colorScale(cmap1[j]));
        hsl.l = hsl.l * cmap2[i];
        row.push(hsl.toString());
        
        
      }
      cmap.push(row);
    };

    return cmap;
  };

  var initializeCBar = function(svg, cmap1, cmap2){

    var plot = g3.plot("#container")
          .height(75)
          .width(75)
          .xTickFormat("")
          .x2Title("similarity")
          .yTitle("amplitude")
          .x2TickFormat("")
          .yTickFormat("")
          .y2TickFormat("")
          .margin(0,0,0,550)
	  .xDomain([0,10])
	  .yDomain([0,10])
          .svg(svg)
          .draw();

    var cmap = cBarData(cmap1, cmap2);
    var cmap_plot = g3.canvas(plot, [cmap], [20,40]).draw();
    
 
    svg.append("rect").attr("class", "label-hint")
      .attr("x", 550).attr("y", 75).attr("height", 25)
      .attr("width", 75).attr("stroke", "green")
      .attr("stroke-opacity", 0).attr("fill-opacity", 0)
      .attr("pointer-events", "none");

     
    svg.append("rect").attr("class", "label-hint")
      .attr("x", 530).attr("y", 0).attr("height", 75)
      .attr("width", 75).attr("stroke", "green")
      .attr("stroke-opacity", 0).attr("fill-opacity", 0)
      .attr("pointer-events", "none");

    // Interactions
    plot.getElement("x2Title")
      .attr("class", "cmap_label").data([plot.x2Title()]);
    plot.getElement("yTitle")
      .attr("class", "cmap_label").data([plot.yTitle()]);

    svg.selectAll('.cmap_label')
      .on("mouseenter", function(){
        if($scope.drag_active){
          d3.select(this).text($scope.dummy_text.text())
            .attr("font-size", "24px");
        }
      })
      .on("mouseleave", function(d){
         d3.select(this).text(d)
          .attr("font-size", "12px");
      })
      .on("mouseup", function(){
         if($scope.drag_active){
           d3.select(this).attr("font-size", "12px")
             .data([$scope.dummy_text.text()]);

           vDUpdate();
         }
      });

    return cmap_plot;
  };

  var initializeDrag = function(){

    $scope.drag_active = false;

    var drag = d3.behavior.drag();
    drag.on("dragstart", function(d){
      $scope.drag_active = true;
      $scope.svg.selectAll('.label-hint').attr("stroke-opacity", 1);
      $scope.dummy_text.text(d)
        .attr("pointer-events", "none")
	.attr("x", d3.mouse($scope.svg.node())[0])
	.attr("y", d3.mouse($scope.svg.node())[1]);});
    
    drag.on("drag", function(){
      $scope.dummy_text
	.attr("x", d3.mouse($scope.svg.node())[0])
	.attr("y", d3.mouse($scope.svg.node())[1]);});
    
    drag.on("dragend", function(){
      $scope.drag_active = false;
      $scope.dummy_text.text('');
      $scope.svg.selectAll('.label-hint').attr("stroke-opacity", 0);
    });

   return drag;
  };
    
  var vDUpdate = function vDUpdate(){


    var attr2 = $scope.cbar._plot.getElement('x2Title').text();
    var attr1 = $scope.cbar._plot.getElement('yTitle').text();

    $http.get('/vd_data?attr1=' + attr1 +'&attr2=' + attr2)
      .then(function(resp){

        var data = colorScale(resp.data.attr1, resp.data.attr2);

        $scope.vDPlot.reDraw(data);
        

        var cmap = cBarData(resp.data.cbar1, resp.data.cbar2);

        $scope.cbar.reDraw([cmap]);
      });

  };
}
);

// <-- HELPER FUNCTIONS --> //
// Take two numbers and return the abs max of the two
function getMax(a, b){
  if(Math.abs(a) > Math.abs(b)){
    return Math.abs(a);
  } else {
    return Math.abs(b);
  }
}



// Get a row from a columnar matrix
function getCrossSection(matrix, value, sampleRate){
    var arr = [];
    var rowIndex = Math.floor(value / sampleRate);
  for(var i = 0; i < matrix.length; i++){
    arr.push(matrix[i][rowIndex]);
  }
  return arr;

}
