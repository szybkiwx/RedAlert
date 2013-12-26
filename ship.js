RedAlert.Weapon = function(maxPower, powerUpTime, damage) {
	this.maxPower = maxPower;
	this.powerUpTime = powerUpTime;
	this.damage = damage;
	
	this.prepareToFight = function() {
		this.power = 0;
	}
}

RedAlert.LaserWeapon = function(maxPower, powerUpTime, damage) {
	RedAlert.Weapon.call(this, maxPower, powerUpTime, damage);
	
}

RedAlert.LaserWeapon.prototype = RedAlert.Weapon;
RedAlert.LaserWeapon.prototype.constructor = RedAlert.LaserWeapon;

RedAlert.MissileWeapon = function(maxPower, powerUpTime, damage) {
	RedAlert.Weapon.call(this, maxPower, powerUpTime, damage);
}

RedAlert.MissileWeapon.prototype = RedAlert.Weapon;
RedAlert.MissileWeapon.prototype.constructor = RedAlert.MissileWeapon;


RedAlert.Ship = function() {
	var pane = RedAlert.Pane();
	var tileSize = {x:50, y:25};
	var imgLoaderSync = 0;
	function getImage(name) {
		var image = resources.get('images/ship/'+name + '.png');
		image.style.width = '50%';
		image.style.height = 'auto';
		return image;
	}
	
	var Tile = function(/*Point*/position, symbol, img){
	
		var imgs = {
			'w' : getImage('weapon'),
			'e' : getImage('engine'),
			'q' : getImage('living-quarters'),
			'c' : getImage('crate'),
			's' : getImage('shields'),
			'l' : getImage('scanners'),
		};
	
		this.position = position;
		this.symbol = symbol
		this.img = img;
		
		this.draw = function() {
			var context = pane.context();

			context.beginPath();
			context.rect(this.position.x, this.position.y, tileSize.x - 2, tileSize.y - 2);
			context.fillStyle = '#D8D8D8';
			context.fill();
			context.strokeStyle = '#2E2E2E';
			context.lineWidth = 1;
			context.stroke();
			context.fillStyle = '#6E6E6E';
			context.font = '24px Calibri';
			if(symbol in imgs) {
				context.drawImage(imgs[symbol], this.position.x + 5, this.position.y + 5);
			}
			else {
				context.fillText(symbol, this.position.x + 25, this.position.y + 25);
			}
		}
	};
	
	var layout = [
		'xxxaaxxx',
		'ahhw----',
		'ahheq---p',
		'accsl---p',
		'acc-----',
		'xxxaaxxx'
	];
	var tiles = [];
	var context = document.getElementById('gameWindow').getContext("2d");
	
	var weaponSlots = [null, null, null, null];
	var init = function() {
		for(var i = 0; i < layout.length; i ++) {
			for(var j = 0; j < layout[i].length; j++) {
				if(layout[i][j] != 'x') {
					tiles.push(new Tile(new RedAlert.Point(j * tileSize.x, i * tileSize.y), layout[i][j], ''));
				}
			}
		}
		
	};
	
	var draw = function() {
		for(var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			tile.draw();
		}
	};
	
	return extend(pane, {
		draw: draw,
		init: init

	});	
	
};