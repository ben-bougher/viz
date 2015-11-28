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
    
    $scope.scatDirty = false;
    $scope.vDDirty = false;

    // Get the data
    $http.get('/data').then(
	function(resp){

	    $scope.vDPlot = initializeSeismic();
	    var svg = $scope.vDPlot.svg()

	    $scope.scatterMatrix = initializeScatterMatrix(resp.data.attributes, 
							   resp.data.data, svg);
	    $scope.scatter = initializeScatter(svg, resp.data.data);

	    $scope.attributes = resp.data.attributes;
	    $scope.data = resp.data.data;
	    $scope.svg = svg;

	});



    $scope.colorScale = d3.scale.linear().domain([-1,0,1])
	.range(['#FF0000', '#FFF', '#0000FF']);


    var initializeSeismic = function(){

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

	return vDPlot;
    };

   var initializeScatter = function(canvas, data){

       canvas.append('g')
	   .attr("id", 'scatter')
	   .attr("transform", "translate(700,0)");
	
	// Make the first scatter plot
       var s1Plot = g3.plot('#scatter')
	   .height(250)
	   .xDomain([-3,3])
	   .yDomain([-3,3])
	   .width(250)
	   .xTickFormat("")
	   .x2TickFormat("")
	   .y2TickFormat("")
	   .yTickFormat("")
	   .margin(20,40,40,40)
	   .draw();

       var scatter = g3.scatter(s1Plot, data);
       return scatter;
   };

    var initializeScatterMatrix = function(attributes, data, canvas){


	var plots = [];

	var scopeFunc = function(primary_attr, secondary_attr){
	    var prime = primary_attr;
	    var second = secondary_attr;
	    var updateScatter = function(){
		$scope.scatter._plot.xTitle(prime).yTitle(second);
		if($scope.scatDirty){
		    $scope.scatter.reDraw(prime, second);
		    $scope.scatter._plot.getElement('xTitle').text(prime);
		    $scope.scatter._plot.getElement('yTitle').text(second);
		    } else{
			$scope.scatter.draw(prime, second);
			$scope.scatDirty = true;
			$scope.scatter._plot.setTitles()
		    };

	
		
	    }
	    return updateScatter;
	}


	canvas.append('g')
	    .attr("id", 'small_multiples')
	    .attr("transform", "translate(500,100)");
	
	for(var i=0; i<attributes.length; i++){
	    var primary_attr = attributes[i];
	    
	    for(var j=1; j< attributes.length - i; j++){
		var secondary_attr = attributes[i+j];
		var yTitle = "";
		var xTitle = "";
		var yMarg = 20;

		if(i===0){
		    yTitle = secondary_attr;
		};
		if((i+j)===(attributes.length-1)){
		    xTitle = primary_attr;
		    yMarg = 30;
		};

		var xPos = i * 60 + 20; 
		var yPos = (i + j) * 60 + 20;
		var plot =  g3.plot('#small_multiples')
		    .height(50)
		    .xDomain([-3,3])
		    .yDomain([-3,3])
		    .width(50)
		    .yTitle(yTitle)
		    .x2Title(xTitle)
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
    


});

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
