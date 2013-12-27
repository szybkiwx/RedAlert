RedAlert.Weapon = function(powerConsumption, powerUpTime, damage) {
	this.powerConsumption = powerConsumption;
	this.powerUpTime = powerUpTime;
	this.damage = damage;
	this.powerUp = 0;
	
	this.draw = function() {
		
	};
}

RedAlert.LaserWeapon = function(powerConsumption, powerUpTime, damage) {
	RedAlert.Weapon.call(this, powerConsumption, powerUpTime, damage);
}

RedAlert.LaserWeapon.prototype = RedAlert.Weapon;
RedAlert.LaserWeapon.prototype.constructor = RedAlert.LaserWeapon;

RedAlert.MissileWeapon = function(powerConsumption, powerUpTime, damage) {
	RedAlert.Weapon.call(this, powerConsumption, powerUpTime, damage);
}

RedAlert.MissileWeapon.prototype = RedAlert.Weapon;
RedAlert.MissileWeapon.prototype.constructor = RedAlert.MissileWeapon;

RedAlert.ShipBackground = function() {
	var draw = function() {
		var pane = RedAlert.Pane();
		var ctx = pane.context();
		var canvasSize = pane.canvasSize();
		var number = Math.random() * 50 + 50;
		
		var colors = [0, 1, 2];
		
		ctx.fillStyle = '#000';
		ctx.rect(0, 0, canvasSize.width, canvasSize.height);
		ctx.fill();
		var canvasData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
		
		for(var i = 0; i < number; i++) {
			var x = Math.floor(Math.random() * canvasSize.width);
			var y = Math.floor(Math.random() * canvasSize.height);
			var index = (x + y * canvasSize.width) * 4;
			
			var colorIdx = Math.floor(Math.random() * 3);
			
			canvasData.data[index + colorIdx] = Math.floor(Math.random() * 255);
			canvasData.data[index + 3] = Math.floor(Math.random() * 255);
			
		}
		ctx.putImageData(canvasData, 0, 0);
	}
	
	
	return {
		draw: draw
	};
}

RedAlert.Ship = function() {
	var pane = RedAlert.Pane();
	var tileSize = {x:50, y:25};
	var weaponSlotSize = {x: 75, y: 50};
	var weaponSlotCapacity = 4;
	function getImage(name) {
		var image = resources.get('images/ship/'+name + '.png');
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
	
	var tiles = [];
	var context = document.getElementById('gameWindow').getContext("2d");
	
	var weaponSlots = [null, null, null, null];
	
	var init = function(newLayout, weapons) {
		layout = newLayout;
		for(var i = 0; i < weapons.length; i++) {
			weaponSlots[i] = weapons[i];
		}
		
		for(var i = 0; i < layout.length; i ++) {
			for(var j = 0; j < layout[i].length; j++) {
				if(layout[i][j] != 'x') {
					tiles.push(new Tile(new RedAlert.Point(j * tileSize.x, i * tileSize.y), layout[i][j], ''));
				}
			}
		}
		
	};
	
	var drawWeaponSlot = function(top, left) {
		var context = pane.context();
		context.beginPath();
		context.rect(left, top, weaponSlotSize.x, weaponSlotSize.y);
		context.fillStyle = '#D8D8D8';
		context.strokeStyle = '#2E2E2E';
		context.lineWidth = 1;
		context.fill();
		context.stroke();
		
	}
	
	var drawWeapon = function(weapon, barMax, top, left) {
		var barHeight = weapon.powerUpTime / barMax; 
		var context = pane.context();
		context.beginPath();
		context.strokeStyle = '#fff';
		context.lineWidth = 2;
		context.rect(left, top + (weaponSlotSize.y * (1 - barHeight)), 5, barHeight * weaponSlotSize.y);
		context.stroke();
	};
	
	var draw = function() {
		for(var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			tile.draw();
		}
		
		var top = pane.canvasSize().height - 50;
		var left = 50;
		
		var maxWeaponPowerBar = weaponSlots.reduce(function(lastValue, current) { 
			if(current == null) {
				return lastValue;
			}			
			return Math.max(lastValue, current.powerUpTime)
		}, 0);
		
		for(var i  = 0; i < weaponSlots.length; i++) {
			drawWeaponSlot(top, left + i * weaponSlotSize.x );
			var weapon = weaponSlots[i];
			if(weapon != null) {
				drawWeapon(weapon, maxWeaponPowerBar, top, left + i * weaponSlotSize.x);
			}
		}
	};
	
	return extend(pane, {
		draw: draw,
		init: init

	});	
};



RedAlert.Battle = function() {
	var lastTime;

	var playerShip = RedAlert.Ship();
	
	var init = function() {
		var background = RedAlert.ShipBackground();
		background.draw();
		var playerLayout = [
			'xxxaaxxx',
			'ahhw----',
			'ahheq---p',
			'accsl---p',
			'acc-----',
			'xxxaaxxx'
		];
		var playerWeapons = [new RedAlert.MissileWeapon(1, 10, 2), new RedAlert.LaserWeapon(2, 13, 3)];
		
		playerShip.init(playerLayout, playerWeapons);
		playerShip.draw();
	};
	
	var main = function() {
		var now = Date.now();
		var dt = (now - lastTime) / 1000.0;

		update(dt);
		render();

		lastTime = now;
		requestAnimFrame(main);
	}
	
	return {
		init: init, 
		main: main
	}
};

