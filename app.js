

resources.load([
	'images/ship/crate.png',
	'images/ship/engine.png',
	'images/ship/living-quarters.png',
	'images/ship/scanners.png',
	'images/ship/shields.png',
	'images/ship/weapon.png',
	'images/ship/hangar.png',
	'images/ship/door.png',
])

resources.onReady(function() {
	var battle = RedAlert.Battle();
	battle.init();
	battle.main();
});




