var RedAlert = {}

RedAlert.Pane = RedAlert.Pane || function() {
	var draw = function() {}
	return {
		canvasSize: function() {
			var canvas =  document.getElementById('gameWindow');
			return { width: canvas.width, height: canvas.height };
		},	
		context: function() {
			return document.getElementById('gameWindow').getContext("2d");
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

var Point = function(px, py) {
	this.x = px;
	this.y = py;
	
	this.getDistance = function(p2) {
		var dx = p2.x - this.x;
		var dy = p2.y - this.y;
		
		return Math.abs(dx * dx + dy * dy);
	};
	
	this.equals = function(p2) {
		return this.x == p2.x && this.y == p2.y;
	};
};


RedAlert.Layout = RedAlert.Layout || function(gridSize, baconsQuantity, inSide, outSides) {
	var sides = {
		LEFT: new Point(0, gridSize.y / 2), 
		BOTTOM: new Point(gridSize.x / 2, gridSize.y),
		RIGHT: new Point(gridSize.x, gridSize.y / 2),
		TOP: new Point(gridSize.x / 2, 0 )
	}
	
	var bacons = [];
	
	var entryBacon = new Point(0, 0);
	var outBacons = {};
	for(var i = 0; i < outSides.length; i++) {
		outBacons[outSides[i]] = new Point(0, 0);
	}
	
	for(var i = 0; i < baconsQuantity; i++) {
		var newPoint = new Point(
			Math.floor(Math.random() * gridSize.x),
			Math.floor(Math.random() * gridSize.x)
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
	return {
		bacons: bacons,
		entryBacon: entryBacon,
		outBacons: outBacons
	};
}

RedAlert.Sector = RedAlert.Sector || function(config) {
	var pane = RedAlert.Pane();
	
	var baconLimits = config.baconLimits;
	
	var gridSize = config.gridSize;
	
	var baconsQuantity = Math.floor(Math.random() * (baconLimits[1] - baconLimits[0]) + baconLimits[0]); 

	var layout = RedAlert.Layout(gridSize, baconsQuantity, config.in, config.out);
	
	var drawBacon = function(bacon, radius, fillStyle) {
		var ctx = pane.context();
		ctx.fillStyle = typeof fillStyle != "undefined" ? fillStyle : "#000";
		ctx.beginPath();
		ctx.arc(
			10 + Math.floor(pane.canvasSize().width / gridSize.x) * bacon.x, 
			10 + Math.floor(pane.canvasSize().height/ gridSize.y) * bacon.y , radius, 0, 2 * Math.PI);
		ctx.stroke();
	};
	
	var draw = function() {
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
	
	return extend(pane, {
		draw: draw
	});
};

RedAlert.Bacon = RedAlert.Bacon || function() {
	
	return extend(RedAlert.Pane(), {
		
	});
};

RedAlert.Arena = RedAlert.Arena || function() {
	var pane = RedAlert.Pane();


	return extend(pane, {
		
	});
};