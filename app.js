resources.load([
	'images/ship/crate.png',
	'images/ship/engine.png',
	'images/ship/living-quarters.png',
	'images/ship/scanners.png',
	'images/ship/shields.png',
	'images/ship/weapon.png',
])

resources.onReady(function() {
	var ship = RedAlert.Ship();
	ship.init();
	ship.draw();
});




var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};