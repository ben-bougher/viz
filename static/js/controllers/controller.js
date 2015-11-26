

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

  var hsv_text = hsv_group.selectAll('text').data(['hue', 'saturation', 'value']).enter()
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

        .width(80)
        .xTickFormat("")
        .x2TickFormat("")
        .y2TickFormat("")
	.margin(10,10,5,40)
        .draw();
  
  var s1SVG = s1Plot.svg()

  s1SVG.on('mouseup', function(){
    if(drag_active){
      scatterCallback(s1Plot);
    }});
  
  // Make the second scatter plot
  var s2Plot = g3.plot("#s2")
        .height(80)
        .width(80)
        .xTickFormat("")
        .x2TickFormat("")
        .y2TickFormat("")
	.margin(10,10,5,40)
        .draw();


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
        g3.Scatter(plot, data).draw();
      }
    );
  };
  
});
