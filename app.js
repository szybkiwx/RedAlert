

resources.load([
	'images/ship/crate.png',
	'images/ship/engine.png',
	'images/ship/living-quarters.png',
	'images/ship/scanners.png',
	'images/ship/shields.png',
	'images/ship/weapon.png',
])

resources.onReady(function() {
	var battle = RedAlert.Battle();
	battle.init();
});




