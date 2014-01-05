var RedAlert = {}

RedAlert.Pane = RedAlert.Pane || function() {
	var draw = function() {}
	return {
		canvasSize: function() {
			var canvas =  document.getElementById('gameWindow');
			return { width: canvas.width, height: canvas.height };
		},
		canvas: function() {
			return document.getElementById('gameWindow');
		},
		context: function() {
			return this.canvas().getContext("2d");
		},
		draw: draw
	};
};

/*
config = {
	baconLimits: [], 
	gridSize: {x: x, y:y},
	in: "TOP",
	out: ["LEFT", "BOTTOM"] 
}
*/

RedAlert.Point = function(px, py) {
	this.x = px;
	this.y = py;
	
	this.getDistance = function(p2) {
		var dx = p2.x - this.x;
		var dy = p2.y - this.y;
		
		return Math.sqrt(dx * dx + dy * dy);
	};
	
	this.equals = function(p2) {
		return this.x == p2.x && this.y == p2.y;
	};
};


RedAlert.Layout = RedAlert.Layout || function(gridSize, baconsQuantity, inSide, outSides) {

	var sides = {
		LEFT: new RedAlert.Point(0, gridSize.y / 2), 
		BOTTOM: new RedAlert.Point(gridSize.x / 2, gridSize.y),
		RIGHT: new RedAlert.Point(gridSize.x, gridSize.y / 2),
		TOP: new RedAlert.Point(gridSize.x / 2, 0 )
	}
	
	var bacons = [];

	var entryBacon = new RedAlert.Point(0, 0);
	var outBacons = {};
	for(var i = 0; i < outSides.length; i++) {
		outBacons[outSides[i]] = new RedAlert.Point(0, 0);
	}
	
	var sqrt = Math.ceil(Math.sqrt(baconsQuantity));
	
	for(var i = 0; i < baconsQuantity; i++) {
		var newPoint = new RedAlert.Point(
			Math.floor(Math.random() * gridSize.x),
			Math.floor(Math.random() * gridSize.y)
		);
		bacons.push(newPoint);
		
		if( newPoint.getDistance(sides[inSide]) < entryBacon.getDistance(sides[inSide]) ) {
			entryBacon = newPoint;
		}
		
		for(var idx in outBacons) {
			var outBacon = outBacons[idx];
			if( newPoint.getDistance(sides[idx]) < outBacon.getDistance(sides[idx]) ) {
				outBacons[idx] = newPoint;
			}
		}
		
	}
	
	var makeConnections = function(speed) {
		var graph = [];
		var lone = [];
		for(var i = 0; i < bacons.length; i++) {
			graph[i] = [];
		}
		
		for(var i = 0; i < bacons.length; i++) {
			for(var j = i; j < bacons.length; j++) {
				if(i != j) {
					if(bacons[i].getDistance(bacons[j]) < speed * speed) {
						graph[i].push(j);
						graph[j].push(i);
					}
				}
			}
			
			if(graph[i].length === 0) {
				lone.push(i);
			}
		}
		
		//fix lone nodes, flip vertex to the point where it will be reachable from at least one node
		for(var i = 0; i < lone.length; i++) {
			var randomNodeIdx, x1, x2, y1, y2;
			while((randomNodeIdx = Math.floor(Math.random() * bacons.length)) != lone[i]);
			var randomNode = bacons[randomNodeIdx];
			bacons[lone[i]].x = x2 = randomNode.x + (2 * Math.random() * speed - speed);
			x1 = randomNode.x;
			y1 = randomNode.y;
			y2 = Math.floor(Math.sqrt(speed * speed - (x2 - x1) * (x2 - x1))) + y1;  
			graph[lone[i]].push(randomNodeIdx);
			graph[randomNodeIdx].push(lone[i]);
		}
		return graph;
	};
	
	return {
		bacons: bacons,
		
		entryBacon: entryBacon,
		outBacons: outBacons,
		makeConnections: makeConnections
	};
}

RedAlert.Sector = RedAlert.Sector || function(config) {
	var Ship = function(newPoint) {
		this.position = newPoint;
		this.speed = 70; 
		
		this.draw = function() {
			var ctx = pane.context();
			ctx.fillStyle = "rgb(200,0,0)";
			ctx.fillRect (scale.x * this.position.x - 15, scale.y * this.position.y - 15, 10, 15);
		};
	};
	

	var pane = RedAlert.Pane();
	
	var baconLimits = config.baconLimits;
	
	var gridSize = config.gridSize;
	
	var baconsQuantity = Math.floor(Math.random() * (baconLimits[1] - baconLimits[0]) + baconLimits[0]); 

	var layout = RedAlert.Layout(gridSize, baconsQuantity, config.in, config.out);
	
	var ship = new Ship(layout.entryBacon);
	
	var connectionGraph = layout.makeConnections(ship.speed);
	
	var scale = {
		x: Math.floor(pane.canvasSize().width / gridSize.x),
		y: Math.floor(pane.canvasSize().height/ gridSize.y)
	};
	
	var drawBacon = function(bacon, radius, fillStyle) {
		var ctx = pane.context();
		ctx.fillStyle = typeof fillStyle != "undefined" ? fillStyle : "#000";
		ctx.beginPath();
		ctx.arc(
			10 + scale.x * bacon.x, 
			10 + scale.y * bacon.y , radius, 0, 2 * Math.PI);
		ctx.stroke();
	};
	
	var drawBacons = function() {
		for(var baconIdx in layout.bacons) {
			var bacon = layout.bacons[baconIdx];
			
			drawBacon(bacon, 2);
			
			if(layout.entryBacon.equals(bacon)) {
				drawBacon(bacon, 5, "#f00");
			}
			
			for(var idx in layout.outBacons) {
				var outBacon = layout.outBacons[idx];
				if(outBacon.equals(bacon)) {
					drawBacon( bacon, 7, "#00f");
				}
			}
		}
	};
	
	var drawPaths = function() {
		var ctx = pane.context();
		for(var i in layout.bacons) {
			var startBacon = layout.bacons[i];
			if(startBacon.getDistance(ship.position) == 0) {
				for(var adjIdx in connectionGraph[i]) {
					var endBaconIdx = connectionGraph[i][adjIdx];
					var endBacon = layout.bacons[endBaconIdx];
					ctx.beginPath();
					ctx.moveTo( 10 + scale.x * startBacon.x, 10 + scale.y * startBacon.y);
					ctx.lineTo( 10 + scale.x * endBacon.x, 10 + scale.y * endBacon.y);
					ctx.stroke();
				}
				break;
			}
		}
	};
	
	var draw = function() {
		drawBacons();
		drawPaths();
		ship.draw()
	};
	
	return extend(pane, {
		draw: draw
	});
};

RedAlert.Bacon = RedAlert.Bacon || function() {
	var pane = RedAlert.Pane();
	
	
	
	var draw = function() {
	};
	
	return extend(pane, {
	});
};

RedAlert.Arena = RedAlert.Arena || function() {
	var pane = RedAlert.Pane();


	return extend(pane, {
		
	});
};