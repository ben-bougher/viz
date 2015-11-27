'use strict';
var app = angular.module('geophyzviz', 
	['mgcrea.ngStrap', 
	'ngAnimate',
	'angular-flexslider']);

app.config(['$interpolateProvider', function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[');
  $interpolateProvider.endSymbol(']}');
}]);



app.controller('controller', function ($http, $alert, $timeout) {
  

  // Make the seismic plot
  var vDPlot = g3.plot("#container")
        .height(200)
        .xTitle("spatial cross-section")
        .yTitle("time [ms]")
        .width(200)
        .xTickFormat("")
        .x2TickFormat("")
        .y2TickFormat("")
        .margin(20,400,50,40)
	.xDomain([0,50])
	.yDomain([0,50])
        .draw();

  var canvas = vDPlot.svg();

  var colorScale = d3.scale.linear().domain([-1,0,1])
	.range(['#FF0000', '#FFF', '#0000FF']);


  // dummy element for drag events
  var dummy_text = canvas.append('text')
	.attr("id", "dummy_text");
  var drag_active = false;

  // Make the main groups
  //var seismic_group = d3.select('#canvas').append('g')
  //	.attr("id", "seis");
  var scatter_group = canvas.append('g')
	.attr("id", 'scatter')
	.attr("transform", "translate(400,0)");
  var s1 = scatter_group.append("g")
	.attr("id", "s1");
  var s2 = scatter_group.append("g")
	.attr("id", "s2")
	.attr("transform", "translate(0,100)");

  var hsv_group = canvas.append('g')
	.attr('transform', 'translate(250,20)');

    var hsv_text = hsv_group.selectAll('text').data(['None', 'None', 'None']).enter()
	.append('text')
	.text(function(d){return d})
	.attr("font-family", "sans-serif")
	.attr("font-size", "12px")
	.attr('y', function(d,i){return i*12;});
  
  hsv_text.on('mouseover', function(d){
    if(drag_active){
      d3.select(this).attr("font-size", "18px").text(dummy_text.text());
    }
  });

  hsv_text.on('mouseout', function(d){
    d3.select(this).attr("font-size", "12px").text(d);
  });

  hsv_text.on('mouseup', function(){
    if(drag_active){
      d3.select(this).text(dummy_text.text()).attr("font-size", "12px")
	.data([dummy_text.text()]);
      vDCallback();

    }});		 
  

  var attributes = [];

  // get the attributes
  $http.get('/attributes').then(function(res) {
    attributes = res.data;
    var text = canvas.selectAll(".attr_text").data(attributes).enter()
	  .append('text')
	  .text(function(d){
	    return d;})
	  .attr('class', 'attr_text')
	  .attr("font-family", "sans-serif")
	  .attr("font-size", "12px")
	  .attr('x', 250)
	  .attr("y", function(d,i){
	    return i*12 + 100;
	  })
	  .attr('cursor', 'pointer');

    // do interaction
    var drag = d3.behavior.drag();
    drag.on("dragstart", function(d){
      drag_active = true;
      dummy_text.text(d)
	.attr("x", d3.select(this).attr('x'))
	.attr("y", d3.select(this).attr('y'));});
    drag.on("drag", function(){
      dummy_text
	.attr("x", d3.event.x)
	.attr("y", d3.event.y);});
    drag.on("dragend", function(){
      drag_active = false;
      dummy_text.text('');
    });

    text.call(drag);
  });



  // Make the first scatter plot
  var s1Plot = g3.plot("#s1")
      .height(80)
      .xDomain([-3,3])
      .yDomain([-3,3])
      .width(80)
      .yTitle("None")
      .xTitle("None")
      .xTickFormat("")
      .x2TickFormat("")
      .y2TickFormat("")
      .yTickFormat("")
      .margin(20,40,40,40)
      .draw();
  

    var xTitle = s1Plot.getElement('xTitle');
    xTitle.on('mouseup', 
	      function(){
		  if(drag_active){
		      s1Plot.xTitle(dummy_text.text());
		      scatterCallback(s1Plot);
		  }});

	xTitle.on('mouseover', 
	    function(){
		if(drag_active){
		    s1Plot.getElement('xTitle').text(dummy_text.text());
		}});
	xTitle.on('mouseout', 
	    function(){
		if(drag_active){
		    s1Plot.getElement('xTitle').text(s1Plot.xTitle());
		}});


    xTitle = s1Plot.getElement('yTitle');
    xTitle.on('mouseup', 
	      function(){
		  if(drag_active){
		      s1Plot.yTitle(dummy_text.text());
		      scatterCallback(s1Plot);
		  }});

	xTitle.on('mouseover', 
	    function(){
		if(drag_active){
		    s1Plot.getElement('yTitle').text(dummy_text.text());
		}});
	xTitle.on('mouseout', 
	    function(){
		if(drag_active){
		    s1Plot.getElement('yTitle').text(s1Plot.yTitle());
		}});



  // Make the second scatter plot
  var s2Plot = g3.plot("#s2")
        .height(80)
        .width(80)
        .xTickFormat("")
        .x2TickFormat("")
        .y2TickFormat("")
      .yTitle("None")
      .x2Title("None")
      .xDomain([-3,3])
      .yDomain([-3,3])
      .yTickFormat("")
	.margin(10,40,40,40)
        .draw();


    xTitle = s2Plot.getElement('x2Title');
    xTitle.on('mouseup', 
	      function(){
		  if(drag_active){
		      s2Plot.x2Title(dummy_text.text());
		      scatterCallback(s2Plot);
		  }});

	xTitle.on('mouseover', 
	    function(){
		if(drag_active){
		    s2Plot.getElement('x2Title').text(dummy_text.text());
		}});
	xTitle.on('mouseout', 
	    function(){
		if(drag_active){
		    s2Plot.getElement('x2Title').text(s2Plot.x2Title());
		}});


    xTitle = s2Plot.getElement('yTitle');
    xTitle.on('mouseup', 
	      function(){
		  if(drag_active){
		      s2Plot.yTitle(dummy_text.text());
		      scatterCallback(s2Plot);
		  }});

	xTitle.on('mouseover', 
	    function(){
		if(drag_active){
		    s2Plot.getElement('yTitle').text(dummy_text.text());
		}});
	xTitle.on('mouseout', 
	    function(){
		if(drag_active){
		    s2Plot.getElement('yTitle').text(s2Plot.yTitle());
		}});
  // Callback functions
  var vDCallback = function vDCallback(){

    var requests = hsv_text.data();
    var cmap = [colorScale, colorScale, colorScale];
    
    $http.get('vd_data?attributes=' + JSON.stringify(requests))
      .then(function(response) {
	var data = response.data;
	g3.seismic(vDPlot, data).nDColorMap(cmap).draw();
      });

  };

  var scatterCallback = function scatterCallback(plot){

    var requests = JSON.stringify(hsv_text.data);
    $http.get('scatter_data?attributes=' + requests).then(
      function(resp){

        var data = resp.data;
        g3.scatter(plot, data).draw();
      }
    );
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
