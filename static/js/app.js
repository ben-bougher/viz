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


  $scope.init = false;

  var search =  function(){
    
    var extent = $scope.brush.extent();
    var x1 = extent[0][0];
    var x2 = extent[1][0];
    var y1 = extent[0][1];
    var y2 = extent[1][1];
    var primary = $scope.scatter._plot.getElement("xTitle").text();
    var secondary = $scope.scatter._plot.getElement("yTitle").text();
    $scope.scatter._plot.svg().selectAll("circle").each(function(d){
      if((d[primary] > x1) && (d[primary] < x2) && 
	 (d[secondary] > y1) && (d[secondary] < y2)){
	d.selected = true;
	var node = d3.select(this);
	node.attr("fill", "red");
      } else{
	d.selected = false;
	var node = d3.select(this);
	node.attr("fill", "black");
      }
    });

    for(var i=0; i< $scope.scatterMatrix.length; i++){

      var svg = $scope.scatterMatrix[i]._plot.svg();
      svg.selectAll('circle')
	.attr("fill", function(d){
	  if(d.selected){return 'red';} else {return 'black';}
	});
    }

    $http.get('/mask?attr1='+primary + "&attr2="+ secondary + 
	      "&attr1_clip1=" + x1 + "&attr1_clip2=" + x2 + 
	      "&attr2_clip1=" + y1 + "&attr2_clip2=" + y2)
      .then(function(resp){
        var mask = resp.data.mask;
        
        $scope.vDPlot.drawMask([mask]);
      }); 
  };



  // Get the data
  $http.get('/data').then(
    function(resp){

      $scope.vDPlot = initializeSeismic(resp.data.image_data.amplitude,
                                        resp.data.image_data.similarity);
      
      $scope.drag = initializeDrag();
      var svg = $scope.vDPlot._plot.svg();
      $scope.cbar = initializeCBar(svg, resp.data.cbar1,resp.data.cbar2,
                                  $scope.colorScale);
      vDUpdate('amplitude', 'similarity', $scope.colorScale);
      $scope.svg = svg;
      $scope.scatterMatrix = initializeScatterMatrix(resp.data, svg);
      $scope.scatter = initializeScatter(svg, resp.data);
      
      $scope.attributes = resp.data.attributes;
      $scope.data = resp.data.data;
      $scope.image_data = resp.data.image_data;

      initializeOverview(resp.data);
      $scope.dummy_text = svg.append("text");
      
    });

  var initializeSeismic = function(attr1, attr2){

    // Make the seismic plot
    var vDPlot = g3.plot("#container")
          .height(500)
          .xTitle("spatial cross-section")
          .yTitle("")
          .width(500)
          .xTickFormat("")
	  .yTickFormat("")
          .x2TickFormat("")
          .y2TickFormat("")
          .margin(20,1200,1200,40)
	  .xDomain([0,50])
	  .yDomain([0,50])
          .draw();

    $scope.colorScale = d3.scale.linear()
      .range(['#FF0000', '#FFF', '#0000FF'])
      .domain([-30000*50, 0, 30000*50]);

    var vd = g3.seismic(vDPlot, []);
    return vd;
  };

  var initializeScatter = function(canvas, data){

    canvas.append('g')
      .attr("id", 'scatter')
      .attr("transform", "translate(500,125)");
    
    // Make the first scatter plot
    var s1Plot = g3.plot('#scatter')
	  .height(200)
	  .xDomain([data.min.similarity,data.max.similarity])
	  .yDomain([data.min.amplitude, data.max.amplitude])
          .xTitle('similarity')
          .yTitle('amplitude')
	  .width(200)
	  .xTickFormat("")
	  .x2TickFormat("")
	  .y2TickFormat("")
	  .yTickFormat("")
	  .margin(20,40,40,40)
	  .draw();

    $scope.brush = d3.svg.brush()
      .extent([[0, 200], [0,200]])
      .x(s1Plot.xScale())
      .y(s1Plot.yScale())
      .on("brushend", search);
    s1Plot.svg().append("g").attr("class", "brush").call($scope.brush);

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

	$scope.brush.x($scope.scatter._plot.xScale());
	$scope.brush.y($scope.scatter._plot.yScale());
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

	
      }
    }
    return plots;
  };


  var biColorScale = function biColorScale(attr1, attr2, colorbar){

    var cmap = [];
    for(var i=1; i < attr1.length; i++){
      var row = [];
      for(var j=1; j < attr1[0].length; j++){
	
	var hsl = d3.hsl(colorbar(attr1[i][j]));
	hsl.l = hsl.l * Math.abs(attr2[i][j]);
	row.push(hsl.toString());
	
	
      }
      cmap.push(row);
    }
    return [cmap];
  };
  
  var uniColorScale = function uniColorScale(attr1, colorbar){

    var cmap = [];
    for(var i=1; i < attr1.length; i++){
      var row = [];
      for(var j=1; j < attr1[0].length; j++){
	
	var hsl = d3.hsl(colorbar(attr1[i][j]));
	row.push(hsl.toString());
	
	
      }
      cmap.push(row);
    }
    return [cmap];
  };

  var cBarData = function(cmap1, cmap2, colormap){

    var cmap = [];
    for(var i=1; i < cmap1.length; i++){
      var row = [];
      for(var j=1; j < cmap2.length; j++){
	
	var hsl = d3.hsl(colormap(cmap1[j]));
	hsl.l = hsl.l * cmap2[i];
	row.push(hsl.toString());
	
	
      }
      cmap.push(row);
    };

    return cmap;
  };



  var initializeOverview = function(resp){

    var attributes = resp.attributes;
    var data = resp.image_data;
    var min = resp.min;
    var max = resp.max;
    var height = 50;
    var width = 50;
    var margin_top = 275;
    var margin_left = 800;
    var map_type = resp.cmap;

    for(var i=0; i< attributes.length; i++){

      var attr1 = attributes[i];
      for(var j = 0; j < attributes.length; j++){
	var attr2 = attributes[j];

	if(i===j){
	  var colorbar = d3.scale.linear().domain([min[attr1],
						   max[attr1]])

		.range(['black', 'white']);

	  var image_data = uniColorScale(data[attr1], 
					 colorbar);
	} else{
	  
	  if(map_type[attr1] === "seq"){
	    var colorbar = d3.scale.linear().domain([min[attr1],
						     max[attr1]])
		  .range(['green', 'white']);
	    var image_data = biColorScale(data[attr1], data[attr2], 
					  colorbar);
	  } else{
	    var colorbar = d3.scale.linear().domain([min[attr1]*50,0,
						     max[attr1]*50])
		  .range(['#FF0000', '#FFF', '#0000FF']);

	    var image_data = biColorScale(data[attr1], data[attr2], 
					  colorbar);
	  }
	}
	var element = g3.canvas("#container", image_data, width, height, 
				margin_top + height*j, margin_left + width*i).draw();
	element._canvas.data([{"attr1": attr1, "attr2": attr2, "cbar": colorbar}]).on('click', function(d) {
	  vDUpdate(d.attr1, d.attr2, d.cbar);
	});

      }
    }
  };
  
  var initializeCBar = function(svg, cmap1, cmap2, cbar){

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

    var cmap = cBarData(cmap1, cmap2, cbar);
    $scope.cAxis = plot; 
    var cmap_plot = g3.canvas(plot._elem, [cmap], plot._width, plot._height,
			      plot._margin.top + 20, plot._margin.left + 40).draw();
    
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
  
  var vDUpdate = function vDUpdate(attr1, attr2, colorbar){

    $http.get('/vd_data?attr1=' + attr1 +'&attr2=' + attr2)
      .then(function(resp){

	if(attr1===attr2){
	  var data = uniColorScale(resp.data.attr1,
				   colorbar);
        
	} else{
	  var data = biColorScale(resp.data.attr1, 
				  resp.data.attr2, 
				  colorbar);
	}

	if($scope.init){
	  $scope.vDPlot.reDraw(data);
          $scope.cbar.reDraw([cBarData(resp.data.cbar1, resp.data.cbar2,
                                      colorbar)]);
	} else{
	  $scope.vDPlot._data = data;
	  $scope.vDPlot.draw();
          $scope.init = true;
	}
      });
    $scope.cAxis.getElement("x2Title").text(attr2);
    $scope.cAxis.getElement("yTitle").text(attr1);
  };
});
