
var app = angular.module( 'ticket-status', ['ngRoute','ui.bootstrap','ui.event','ui.keypress'],
function( $routeProvider , $locationProvider ){
	  
});


app.factory('api',function( $http , $rootScope ) {

	var extendPromise = function( promise )
	{
	
		promise.ready = function( usersCompleteCallback ) {
			promise.success(function( response ) {
				if ( response)
				{
					usersCompleteCallback( response );
					$rootScope.$emit('success',response);
				} 
				 
			});
			return promise;
		}
		
		// serverside system error
		promise.error(function(data, status, headers, config){
			$rootScope.$emit( 'error' ,
				[
					'HTTP error' , 
					{ data:data, status:status, headers:headers, config:config } 
				]
			);	
			
		});
		
		return promise;
	
	}
	
	
	var apiConstructor  = function( endPoint )
	{

		var _api =  {
			
			endPoint:endPoint,
		
			call:function( params ) {
				params = params || {};
				
				var promise = $http.get(  this.endPoint , {params: params} );
				
				return extendPromise( promise );
			},
		
		};
		
	
		return _api;
	
	}
	
	return apiConstructor;
});



app.controller('mainController', function( $rootScope , $scope , $sce , $location , api ){
	
	// data for the ng controller scope
	$scope.data = {};
	$scope.info = {};
		
		
	// update every 3 seconds
	var updateInterval = 3000;
	
	// where to retrieve the data from?
	var dataURL = "retrieve.php";
	
	// the api to access the data
	var dataAPI = api( dataURL );
	
	// no data has been rendered yet
	var firstLoad = true;
	
	// D3 Objects
	var 
			svg
			, gStroke , gColor , gTextTitle, gTextValue			
			, textValue , textTitle , circleStroked, circleColored , clip
		;
			
	
	// the rendering function, get's called on new data arrival
	var render = function( data )
	{
		

		// data points and sum
		var dataPoints  = [];
		var dataCount = 0;
		var dataSum = 0;
		for (var x in data) 
		{
			dataSum += data[x];
			dataCount++;
		}
		
		// width and height of the SVG canvas ( parent DIV element )		
		var canvasWidth = $("#canvas").width();
		var canvasHeight = $("#canvas").height();
		
		var PI = 3.141;
		
		// starting angle for the bowls
		var angle = -PI / 2;
		
		// equally space out the bowles
		var diffAngle = 2 * PI / dataCount ;
		
		// colors in order
		var fillColors = ["steelblue" , "orange" , "purple" , "darkred" , "green"];
		var strokeColors = ["steelblue" , "darkorange" , "purple" , "darkred" , "darkgreen"];
		
		// offset for the center of bowles
		var offsetX = canvasWidth / 2;
		var offsetY = canvasHeight / 2;
		
		// bowl size and distance
		var circleRadius = 100;		
		var circleDistance = 200;
		
		// animation duration in ms
		var transitionDuration = 500;	
		
		var i = 0;
		
		// create datapoints
		for (var field in data)
		{
			
			var value = data[field];
			var percentage = (value / dataSum);
			dataPoints.push( 
				{
						value:	value
					,	percentage: percentage
					,	x: Math.round( offsetX + Math.cos( angle ) * circleDistance )
					,	y: Math.round( offsetY + Math.sin( angle ) * circleDistance )
					,	index: field
					, 	fillColor: fillColors[ i ]
					, 	strokeColor: strokeColors[ i ]
					, 	title: field 
					, 	description: value + " ( " + Math.round( percentage*100 ) + " % )"
					, 	clipHeightOffset: Math.round((1-percentage) * circleRadius * 2)
					, 	uniqueid: "dataseg-" + i
				}
			);
			
			angle += diffAngle;
			i++;
		}
		
		
		// maybe this is the first data we know of, so setup the D3 objects
		if ( firstLoad ) 
		{
		
			////////////////////////////
			// d3
			
			svg = d3.select("#svg");
			gStroke = d3.select("#svg").select("#stroke");
			gColor = d3.select("#svg").select("#color");
			gTextTitle = d3.select("#svg").select("#title");
			gTextValue = d3.select("#svg").select("#value");
						
			////////////////////////////
			// clipping			
			
			clip = svg.selectAll("clipPath")
				.data( dataPoints )
			
			clip.exit().remove();
		
			clip.enter().append("clipPath")			
				.append("rect")
				
				
			
			////////////////////////////
			// circle - colored	
			
			circleColored = gColor.selectAll("circle")
				.data( dataPoints )		
			;

			circleColored.exit().remove();

			circleColored.enter().append("circle")
				.attr("r", circleRadius )
				.attr("fill", function(d) { return d.fillColor;  })
				.attr("clip-path", function(d){ return "url(#"+d.uniqueid+")"; } )
				.attr("style","stroke:rgb(0,0,0);stroke-width:0")
			;

			circleColored
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
			;
				
				
			
			////////////////////////////			
			// circle stroked
			
			circleStroked = gStroke.selectAll("circle")
				.data( dataPoints )		
			;

			circleStroked.exit().remove();

			circleStroked.enter().append("circle")
				.attr("r", circleRadius )				
				.attr("style",function(d){return"stroke:"+d.strokeColor+";stroke-width:2;fill:transparent"; })
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; })
			;
			
			
			
			////////////////////////////
			// text title
			
			textTitle = gTextTitle.selectAll("text")
				.data( dataPoints )
			;

			textTitle.exit().remove();

			textTitle.enter().append("text")	
			
			
			
			////////////////////////////	
			// text value
			
			textValue = gTextValue.selectAll("text")
				.data( dataPoints )
			;

			textValue.exit().remove();

			textValue.enter().append("text")
			
		}
		
		// update the D3 objects with new data points and styles
			
		clip
			.data( dataPoints )
			.attr("id",function(d){ return d.uniqueid })
			.select("rect")
				.transition()
				.duration( transitionDuration )
				.attr("x", function(d) { return d.x - circleRadius })
				.attr("y", function(d) { return d.y - circleRadius + d.clipHeightOffset })
				.attr("width" , circleRadius * 2 )
				.attr("height" ,circleRadius * 2 )
				
				
		;
				
		textTitle
			.data( dataPoints )
			.transition()
			.duration( transitionDuration )
			.attr("style", "font-weight:bold;text-align:center;")
			.attr("x", function(d) { return d.x - 20; })
			.attr("y", function(d) { return d.y - 30 - circleRadius + d.clipHeightOffset ; })
			.text(function(d){ return d.title })
		;
		
		textValue			
			.data( dataPoints )
			.transition()
			.duration( transitionDuration )
			.attr("x", function(d) { return d.x - 30; })
			.attr("y", function(d) { return d.y - 10 - circleRadius + d.clipHeightOffset ; })
			.text(function(d){ return d.description })
		;
		
		
		// not a first load any more
		firstLoad = false;
	}
	
	
	var loopIt = function(){
		dataAPI.call().ready(function(r){
			$scope.data = r.data;
			$scope.info = r.info;
			render( r.data );
		});		
	};
	
	
	loopIt();
	setInterval( loopIt , updateInterval );
	

});


