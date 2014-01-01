

resources.load([
	'images/ship/crate.png',
	'images/ship/engine.png',
	'images/ship/living-quarters.png',
	'images/ship/scanners.png',
	'images/ship/shields.png',
	'images/ship/weapon.png',
	'images/ship/hangar.png',
	'images/ship/door.png',
	'images/ship/crosshair.png',
	'images/ship/laserbullet.png'
])

resources.onReady(function() {
	var battle = RedAlert.Battle();
	battle.init();
	battle.main();
});


Queue = function() {
	var array = [],
		head = 0,
		tail = -1;
	return {
		push: function(element) {
			array[++tail] = element;
		},
		pull: function() {
			var element = array[head];
			array[head] = void 0;
			head++;
			return element;
		},
		isEmpty: function() {
			return tail < head;
		}
	}
};

RedAlert.ClickHandlers = function() {
	var pane = RedAlert.Pane();
	
	var rects = [];
	
	
	
	var registerRect = function(x, y, w, h, callback) {
		rects.push({rect: {x:x, y:y, w:w, h:h}, callback: callback});
	};
	var click = function click(event) {
		var canvas = pane.canvas(),
			canvasLeft = canvas.offsetLeft,
			canvasTop = canvas.offsetTop;
			x = event.pageX - canvasLeft,
			y = event.pageY - canvasTop;
	
		for(var i = 0; i < rects.length; i++) {
			var rect = rects[i].rect;
			if(x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
				rects[i].callback.call(this, x, y);
			}
		}
	};
	
	pane.canvas().addEventListener('click', click);
	
	return {
		registerRect:registerRect,
		click:click,
		rects:rects		
	};
	
};

