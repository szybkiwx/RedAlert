RedAlert.Weapon = function(powerConsumption, powerUpTime, damage, label) {
	this.powerConsumption = powerConsumption;
	this.powerUpTime = powerUpTime;
	this.damage = damage;
	this.label = label;
	this.powerUp = 0;
	
	this.isPowered = function() {
		return this.powerUp === this.powerUpTime;
	};
}

RedAlert.LaserWeapon = function(powerConsumption, powerUpTime, damage, label) {
	RedAlert.Weapon.call(this, powerConsumption, powerUpTime, damage, label);
}

RedAlert.LaserWeapon.prototype = RedAlert.Weapon;
RedAlert.LaserWeapon.prototype.constructor = RedAlert.LaserWeapon;

RedAlert.MissileWeapon = function(powerConsumption, powerUpTime, damage, label) {
	RedAlert.Weapon.call(this, powerConsumption, powerUpTime, damage, label);
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

RedAlert.Ship = function(inOrientation, inDrawingOffset) {
	var pane = RedAlert.Pane();
	
	var weaponSlotSize = {x: 75, y: 50};
	var weaponSlotCapacity = 4;

	var tileSize = {x:50, y:35};
	//var drawingOffset = {x: 50, y: 150};
	var drawingOffset = inDrawingOffset;
	//var orientation = 0;
	var orientation = inOrientation;
	
	function getImage(name) {
		var image = resources.get('images/ship/'+name + '.png');
		return image;
	}
	
	var tileConfigs = {
		'w' : { img: getImage('weapon') }, 
		'e' : { img:getImage('engine')},
		'q' : { img:getImage('living-quarters')},
		'c' : { img:getImage('crate'), size: {w:2, h:2}},
		'h' : { img:getImage('hangar'), size: {w:2, h:2}},
		's' : { img:getImage('shields')},
		'l' : { img:getImage('scanners')},
		'd' : { img:getImage('door')}
	};
	
	
	var Tile = function(/*Point*/position, symbol){
		this.position = position;
		this.symbol = symbol;
		
		this.getPosition = function() {
			return { 
				x: (orientation == 0 ? this.position.x : this.position.y) + drawingOffset.x,
				y: (orientation == 0 ? this.position.y : this.position.x) + drawingOffset.y,
				sizex: orientation == 0 ? tileSize.x : tileSize.y,
				sizey: orientation == 0 ? tileSize.y : tileSize.x
			};
		};
		
		this.draw = function() {
			var context = pane.context();
			var finalPosition = this.getPosition();
			
			
			context.beginPath();
			
			context.rect(finalPosition.x, finalPosition.y, finalPosition.sizex - 2, finalPosition.sizey - 2);
			context.fillStyle = '#D8D8D8';
			context.fill();
			context.strokeStyle = '#2E2E2E';
			context.lineWidth = 1;
			context.stroke();
			
			context.fillStyle = '#6E6E6E';
			context.font = '24px Calibri';
			if(symbol in tileConfigs) {
				context.drawImage(tileConfigs[symbol].img, finalPosition.x + 5, finalPosition.y + 5);
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
		context.fillStyle = '#000';//'#D8D8D8';
		context.strokeStyle = '#2E2E2E';
		context.lineWidth = 1;
		context.fill();
		context.stroke();
		
	}
	
	var setWeaponLabel = function(top, left, label) {
		
		var lines = label.split(' ');
		var x = left + 20, y = top + 15;
		var ctx = pane.context();
		ctx.font = '14px Calibri bold';
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 0.5;
		for(var i = 0; i < lines.length; i++) {
			var line = lines[i];
			ctx.fillText(line, x, y);
			
			y += 15;
		}

	};
	
	var drawWeapon = function(weapon, barMax, top, left) {
		var barHeight = weapon.powerUpTime / barMax; 
		var context = pane.context();
		var style = weapon.isPowered() ? '#0f0' : '#fff';
		
		context.beginPath();
		context.strokeStyle = style;
		context.lineWidth = 2;
		context.rect(left, top + (weaponSlotSize.y * (1 - barHeight)), 5, barHeight * weaponSlotSize.y);
		context.stroke();
		
		barHeight = weapon.powerUp / barMax;
		
		context.beginPath();
		context.fillStyle = style;
		context.rect(left, top + (weaponSlotSize.y * (1 - barHeight)), 5, barHeight * weaponSlotSize.y);
		context.fill();
		
		setWeaponLabel(top, left, weapon.label, 10);
	};
	
	var activeWeaponSlots = function() {
		return weaponSlots.filter(function(val) {return val != null;});
	};
	
	var update = function(dt) {
		var slots = activeWeaponSlots();
		for(var i = 0; i < slots.length; i++) {
			var weapon = slots[i];
			weapon.powerUp += dt;
			if(weapon.powerUp >= weapon.powerUpTime) {
				weapon.powerUp = weapon.powerUpTime;
			}			
		}
	};
	
	var draw = function() {
		for(var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			tile.draw();
		}
		
		//draw module walls
		for(var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
		
			if(tile.symbol in tileConfigs ) {
				var scalex = 1, scaley = 1;
				if("size" in tileConfigs[tile.symbol]) {
					scalex = tileConfigs[tile.symbol].size.w;
					scaley = tileConfigs[tile.symbol].size.h;
					if(orientation == 1) {
						scaley = [scalex, scalex = scaley][0];
					}
				}
				context.beginPath();
		
				context.strokeStyle = 'red';
				var position = tile.getPosition();
				
				context.rect(position.x, position.y, scalex * position.sizex - 3, scaley * position.sizey - 3);
				context.stroke()
			}
			
		}
		
		var top = pane.canvasSize().height - drawingOffset.y;
		var left = drawingOffset.x;
		
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
		drawWeapon: drawWeapon,
		setWeaponLabel: setWeaponLabel,
		drawWeapon: drawWeapon,
		activeWeaponSlots: activeWeaponSlots,
		
		draw: draw,
		init: init,
		update: update

	});	
};

/*RedAlert.EnemyShip = function() {
	var ship = RedAlert.Ship();
	
	var tileSize = {x:50, y:35};
	var drawingOffset = {x: 50, y: 150};
	
	var orientation = 1;	
	
	return extend(ship, {
	});
};*/

RedAlert.Battle = function() {
	var lastTime;

	var playerShip = RedAlert.Ship(0,  {x: 50, y: 150});
	
	var enemyShip = RedAlert.Ship(1,  {x: 750, y: 50});
	
	
	var init = function() {
		var background = RedAlert.ShipBackground();
		background.draw();
		var playerLayout = [
			'xxxddxxx',
			'dh w----',
			'd  eq---p',
			'dc sl---p',
			'd  -----',
			'xxxddxxx'
		];
		var playerWeapons = [new RedAlert.MissileWeapon(1, 10, 2, 'Archer Missile Launcher'), new RedAlert.LaserWeapon(2, 13, 3, 'Light Laser Cannon')];
		
		playerShip.init(playerLayout, playerWeapons);
		playerShip.draw();
		
		var enemyLayout = [
			'xxxddxxx',
			'dh w----',
			'd  eq---p',
			'dc sl---p',
			'd  -----',
			'xxxddxxx'
		];
		var enemyWeapons = [new RedAlert.MissileWeapon(1, 10, 2, 'Archer Missile Launcher'), new RedAlert.LaserWeapon(2, 13, 3, 'Light Laser Cannon')];
		
		enemyShip.init(enemyLayout, enemyWeapons);
		enemyShip.draw();
	};
	
	var update = function(dt) {
		playerShip.update(dt);
	}
	
	var render = function() {
		playerShip.draw();
	};
	
	var main = function() {
		var now = Date.now();
		var dt = (now - (lastTime || now))/1000;

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

