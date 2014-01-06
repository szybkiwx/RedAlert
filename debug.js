function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
	  x: evt.clientX - rect.left,
	  y: evt.clientY - rect.top
	};
}

var canvas = document.getElementById('gameWindow');
var context = canvas.getContext('2d');

canvas.addEventListener('mousemove', function(evt) {
	var mousePos = getMousePos(canvas, evt);
	document.getElementById('posx').innerHTML = mousePos.x;
	document.getElementById('posy').innerHTML = mousePos.y;
	
}, false);

radio('genericclik').subscribe(function(x, y) {
	document.getElementById('lastckick').innerHTML = 'x: ' + x + ', y:'+ y;}
);