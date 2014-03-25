
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
	
	var _api = api("retrieve.php");
	
	$scope.data = {};
	$scope.dataPoints = {};
	$scope.sum = 0;
	
	$scope.sum = function(){
		var total = 0;
		for (  var x in $scope.data ) 
		{
			total += $scope.data[x];
		}
		
		return total;
	}
		

	
	var firstLoad = true;
	
	var 
			svg
			, gStroke, gColor, gText			
			, text , circleStroked, circleColored , clip
		;
		
			
	
	var calculateDataPoints = function()
	{
		
		var dataPoints  = [];
	
		var dataCount = 0;
		for (var x in $scope.data)		
			dataCount++;
		
		
		// settings
		var angle = - 3.14/2;
		var diffAngle = 2*3.14 / dataCount ;
		
		var colors = ["steelblue" , "orange" , "brown" , "red" , "yellow"];
		
		var canvasWidth = $("#canvas").width();
		var canvasHeight = $("#canvas").height();
		var offsetX = canvasWidth / 2;
		var offsetY = canvasHeight / 2;
		
		var circleRadius = 100;		
		var circleDistance = 200;
		
		var transitionDuration = 500;		 //ms
		
		var dataSum = $scope.sum();
		
		var i = 0;
		
	
		for (var field in $scope.data)
		{
			
			
			var value = $scope.data[field];
			var percentage = (value / dataSum);
			dataPoints.push( 
				{
						value:	value
					,	percentage: percentage
					,	x: Math.round( offsetX + Math.cos( angle ) * circleDistance )
					,	y: Math.round( offsetY + Math.sin( angle ) * circleDistance )
					,	index: field
					, 	color: colors[ i ]
					, 	description: field + " : " + value 
					, 	height: Math.round(percentage * circleRadius * 2)
							
				}
			);
			
			angle += diffAngle;
			
			i++;
		}
		
		
		
		if ( firstLoad ) 
		{
			// d3
				svg = d3.select("#svg");
				gStroke = d3.select("#svg").select("#stroke");
				gColor = d3.select("#svg").select("#color");
				gText = d3.select("#svg").select("#text");
				
				
				// clipping			
				clip = svg.selectAll("clipPath")
					.data( dataPoints )
				
				clip.exit().remove();
			
				clip.enter().append("clipPath")			
					.append("rect")
			
			
			// circle - colored			
				circleColored = gColor.selectAll("circle")
					.data( dataPoints )		
				;

				circleColored.exit().remove();

				circleColored.enter().append("circle")
					.attr("r", circleRadius )
					.attr("fill", function(d) { return d.color;  })
					.attr("clip-path", function(d){ return "url(#"+d.index+")"; } )
					.attr("style","stroke:rgb(0,0,0);stroke-width:0")
				;

				circleColored
					.attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y; })
				;
				
			
			
			// circle stroked
				circleStroked = gStroke.selectAll("circle")
					.data( dataPoints )		
				;

				circleStroked.exit().remove();

				circleStroked.enter().append("circle")
					.attr("r", circleRadius )				
					.attr("style","stroke:rgb(0,0,0);stroke-width:2;fill:transparent")
				;
			
			// text
				text = gText.selectAll("text")
					.data( dataPoints )
				;

				text.exit().remove();

				text.enter().append("text")						
					.attr("x", function(d) { return d.x - 30; })
					.attr("y", function(d) { return d.y; })
				;
			
		}
		
		// update
			
		clip
			.data( dataPoints )
			.attr("id",function(d){ return d.index })
			.select("rect")
				.transition()
				.duration( transitionDuration )
				.attr("x", function(d) { return d.x - circleRadius })
				.attr("y", function(d) { return d.y + d.height})
				.attr("width", circleRadius*2 )
				.attr("height",function(d){
					return d.height + circleRadius
				})
				
		;
		
		circleStroked
			.data( dataPoints )
			.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; })
		;
		
		text			
			.data( dataPoints )
			.text(function(d){ return d.description })
		;
		
		
		//

		firstLoad = false;

			
	}
	
	
	var loopIt = function(){
		_api.call().ready(function(r){
			$scope.data = r;
			calculateDataPoints();
		});		
	};
	
	
	loopIt();
	setInterval( loopIt , 3000 );
	
	

});


