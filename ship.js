RedAlert.Weapon = function(ship, powerConsumption, powerUpTime, damage, label) {

	this.ship = ship;
	this.powerConsumption = powerConsumption;
	this.powerUpTime = powerUpTime;
	this.damage = damage;
	this.label = label;
	this.powerUp = 0;
	this.selected = false;
	this.target = null;
	this.bullet = null;
	this.bulletImg = '';
}

RedAlert.Weapon.prototype.fire = function() {
	//this.sprite = new Sprite(this.spriteImg, [this.ship.getWeaponPosition().x, this.ship.getWeaponPosition().y], [12, 12], 10);
	this.bullet = {x: this.ship.getWeaponPosition().x, y: this.ship.getWeaponPosition().y};
	
	
	var self = this;
	radio('shotfinished').subscribe(function() {
		self.target = null;
		self.sprite = null;
	});
};

RedAlert.Weapon.prototype.update = function(dt) {
	if(this.powerUp != this.powerUpTime) {
	
		if(this.powerUp + dt > this.powerUpTime) {
			this.powerUp = this.powerUpTime;
			radio('weaponcharged').broadcast(this);
		}			
		else if(this.powerUp + dt < this.powerUpTime){
			this.powerUp += dt;
		}
	}
	
	if(this.bullet != null) {
		this.bullet.x += 100 * dt;
	}
}

RedAlert.Weapon.prototype.draw = function(barMax, top, left) {
	var barHeight = this.powerUpTime / barMax; 
	var context = this.ship.context();
	var style = this.isPowered() ? '#0f0' : '#fff';
	
	context.beginPath();
	context.strokeStyle = style;
	context.lineWidth = 2;
	context.rect(left, top + (this.ship.weaponSlotSize.y * (1 - barHeight)), 5, barHeight * this.ship.weaponSlotSize.y);
	context.stroke();
	
	barHeight = this.powerUp / barMax;
	
	context.beginPath();
	context.fillStyle = style;
	context.rect(left, top + (this.ship.weaponSlotSize.y * (1 - barHeight)), 5, barHeight * this.ship.weaponSlotSize.y);
	context.fill();
	
	this.setWeaponLabel(top, left, this.label, 10);
	
	if(this.selected) {
		context.beginPath();
		context.strokeStyle = 'orange';
		context.lineWidth = 2;
		context.rect(left, top, this.ship.weaponSlotSize.x - 1, this.ship.weaponSlotSize.y);
		context.stroke();
	}
	
	if(this.bullet != null) {
		context.drawImage(resources.get(this.bulletImg), this.bullet.x, this.bullet.y); 
	}

}

RedAlert.Weapon.prototype.setWeaponLabel = function(top, left, label) {
	var lines = label.split(' ');
	var x = left + 20, y = top + 15;
	var ctx = this.ship.context();
	ctx.font = '14px Calibri bold';
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 0.5;
	for(var i = 0; i < lines.length; i++) {
		var line = lines[i];
		ctx.fillText(line, x, y);
		y += 15;
	}
};

RedAlert.Weapon.prototype.isPowered = function() {
	return this.powerUp === this.powerUpTime;
};

RedAlert.LaserWeapon = function(ship, powerConsumption, powerUpTime, damage, label) {
	RedAlert.Weapon.call(this, ship, powerConsumption, powerUpTime, damage, label);
	this.bulletImg = 'images/ship/laserbullet.png';
	
}

RedAlert.LaserWeapon.prototype = new RedAlert.Weapon();
RedAlert.LaserWeapon.prototype.constructor = RedAlert.LaserWeapon;

RedAlert.MissileWeapon = function(ship, powerConsumption, powerUpTime, damage, label) {
	RedAlert.Weapon.call(this, ship, powerConsumption, powerUpTime, damage, label);
	this.bulletImg = 'images/ship/laserbullet.png';
}

RedAlert.MissileWeapon.prototype = new RedAlert.Weapon();
RedAlert.MissileWeapon.prototype.constructor = RedAlert.MissileWeapon;

RedAlert.ShipBackground = function() {
	var canvasData = null;
	var pane = RedAlert.Pane();
	
	var init = function() {
		var ctx = pane.context();
		var canvasSize = pane.canvasSize();
		var number = Math.random() * 50 + 50;
		
		var colors = [0, 1, 2];
		
		ctx.fillStyle = '#000';
		ctx.rect(0, 0, canvasSize.width, canvasSize.height);
		ctx.fill();
		canvasData = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
		
		for(var i = 0; i < number; i++) {
			var x = Math.floor(Math.random() * canvasSize.width);
			var y = Math.floor(Math.random() * canvasSize.height);
			var index = (x + y * canvasSize.width) * 4;
			
			var colorIdx = Math.floor(Math.random() * 3);
			
			canvasData.data[index + colorIdx] = Math.floor(Math.random() * 255);
			canvasData.data[index + 3] = Math.floor(Math.random() * 255);
			
		}
		
	
	};
	
	var draw = function() {
		var ctx = pane.context();
		ctx.putImageData(canvasData, 0, 0);
	}
	
	
	return {
		draw: draw,
		init: init
	};
}


RedAlert.Ship = function(inHandlers, inOrientation, inDrawingOffset) {
	var pane = RedAlert.Pane();
	
	var weaponSlotSize = {x: 75, y: 50};
	var weaponSlotCapacity = 4;

	var tileSize = {x:50, y:35};
	//var drawingOffset = {x: 50, y: 150};
	var drawingOffset = inDrawingOffset;
	//var orientation = 0;
	var orientation = inOrientation;
	
	var handlers = inHandlers;
	
	var activeWeapon = null;
	
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
	
	var Tile = function(ship, /*Point*/position, symbol){
		this.position = position;
		this.symbol = symbol;
		this.ship = ship;
		var finalPosition = this.getPosition();
		var self = this;
		
		handlers.registerRect(finalPosition.x, finalPosition.y, finalPosition.sizex, finalPosition.sizey, function(x, y) {
			if(self.ship.orientation === 1) {
				radio('tileclicked').broadcast(x, y);
			}
		});
	};

	Tile.prototype.getPosition = function() {
		return { 
			x: (this.ship.orientation == 0 ? this.position.x : this.position.y) + drawingOffset.x,
			y: (this.ship.orientation == 0 ? this.position.y : this.position.x) + drawingOffset.y,
			sizex: this.ship.orientation == 0 ? tileSize.x : tileSize.y,
			sizey: this.ship.orientation == 0 ? tileSize.y : tileSize.x
		};
	};
	
	Tile.prototype.draw = function() {
		var context = pane.context();
		var finalPosition = this.getPosition();
		
		context.beginPath();
		
		context.rect(finalPosition.x, finalPosition.y, finalPosition.sizex - 2, finalPosition.sizey - 2);
		context.fillStyle = '#D8D8D8';
		context.fill();
		context.strokeStyle = '#9E9E9E';
		context.lineWidth = 1;
		//context.stroke();
		
		context.fillStyle = '#6E6E6E';
		context.font = '24px Calibri';
		if(this.symbol in tileConfigs) {
			context.drawImage(tileConfigs[this.symbol].img, finalPosition.x + 5, finalPosition.y + 5);
		}
	
		if(this.ship.orientation === 1) {
			for(var i = 0; i < this.ship.crosshairs.length; i++) {
				var crosshair = this.ship.crosshairs[i];
				if(crosshair !== null && crosshair.x >= finalPosition.x && crosshair.x < finalPosition.x + finalPosition.sizex 
					&& crosshair.y >= finalPosition.y && crosshair.y < finalPosition.y + finalPosition.sizey ) {
					pane.context().drawImage(resources.get('images/ship/crosshair.png'), finalPosition.x, finalPosition.y)
				}				
			}
		}
	}

	var tiles = [];
	var context = document.getElementById('gameWindow').getContext("2d");
	
	var weaponSlots = [null, null, null, null];
	
	var crosshairs = [null, null, null, null];
	
	//tile which serves as bullet starting point
	var weaponPosition = null;
	
	var init = function(newLayout, weapons) {
		layout = newLayout;
		var top = pane.canvasSize().height - drawingOffset.y;
		var left = drawingOffset.x;;
		for(var i = 0; i < weapons.length; i++) {
			weaponSlots[i] = weapons[i];
			if(orientation === 0) {
				handlers.registerRect(left, top, weaponSlotSize.x, weaponSlotSize.y, function(x, y) {
					radio('weaponslotclicked').broadcast(x, y);
	
				});
				left += weaponSlotSize.x;
				
				
			}
		}
		
		for(var i = 0; i < layout.length; i ++) {
			for(var j = 0; j < layout[i].length; j++) {
				if(layout[i][j] != 'x') {
					var tile = new Tile(this, new RedAlert.Point(j * tileSize.x, i * tileSize.y), layout[i][j], orientation);
					tiles.push(tile);
					if(layout[i][j] == 't') {
						weaponPosition = tile; 
					}
				}
			}
		}
		radio('weaponcharged').subscribe(function(weapon) {
			if(weapon.target != null) {
				weapon.fire();
			}
		});
	};
	
	var lockTarget = function(x, y) {
		var p = {x: x, y: y};
		this.activeWeapon.target = p;
		if(this.activeWeapon.isPowered()) {
			this.activeWeapon.fire();
		}
	};
	
	var setCrosshair = function(x, y, friendShip) {
		var weaponSlots = friendShip.activeWeaponSlots();
		
		var p = {x: x, y: y};
		for(var i = 0; i < weaponSlots.length; i++) {
			var slot = weaponSlots[i];
			if(slot.selected) {
				this.crosshairs[i] = p;
				pane.canvas().style.cursor = "default";
				break;
			}

		}
	}
	
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
	
	var onWeaponSlotClicked = function(clickX, clickY) {

		var weapons = this.activeWeaponSlots();
		var y = this.canvasSize().height - this.drawingOffset.y;
		var x = this.drawingOffset.x;
		
		for(var i = 0; i < weapons.length; i++) {
			var weapon = weapons[i];
			if(clickX >= x && clickX < x + this.weaponSlotSize.x && clickY >= y && clickY < y + this.weaponSlotSize.y){
				weapon.selected = true;
				this.activeWeapon = weapon;
				this.canvas().style.cursor = "url('images/ship/crosshair.png'), auto";
			}
			else {
				weapon.selected = false;
				
			}
			x += weaponSlotSize.x;
		}
		
	};
	
	/*var setWeaponLabel = function(top, left, label) {
		
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

	};*/
	
	/*var drawWeapon = function(weapon, barMax, top, left) {
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
		
		if(weapon.selected) {
			context.beginPath();
			context.strokeStyle = 'orange';
			context.lineWidth = 2;
			context.rect(left, top, weaponSlotSize.x - 1, weaponSlotSize.y);
			context.stroke();
		}
		
	};*/
	
	var activeWeaponSlots = function() {
		return weaponSlots.filter(function(val) {return val != null;});
	};
	
	var update = function(dt) {
		var slots = activeWeaponSlots();
		for(var i = 0; i < slots.length; i++) {
			var weapon = slots[i];
			weapon.update(dt);
		}
	};
	
	var getWeaponSlotLocation = function(slotIndex) {
		var top = pane.canvasSize().height - drawingOffset.y;
		var left = drawingOffset.x
		
		return {x: top, y: left + slotIndex * weaponSlotSize.x};
	}
	
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
		
				context.strokeStyle = 'grey';
				context.lineWidth = 2;
				var position = tile.getPosition();
				
				context.rect(position.x, position.y, scalex * position.sizex - 3, scaley * position.sizey - 3);
				context.stroke()
			}
		}
		
		if (orientation === 0) {
			var maxWeaponPowerBar = weaponSlots.reduce(function(lastValue, current) { 
				if(current == null) {
					return lastValue;
				}			
				return Math.max(lastValue, current.powerUpTime)
			}, 0);
			
			for(var i  = 0; i < weaponSlots.length; i++) {
				var pos = getWeaponSlotLocation(i);
				drawWeaponSlot(pos.x, pos.y );
				var weapon = weaponSlots[i];
				if(weapon != null) {
					weapon.draw(maxWeaponPowerBar, pos.x, pos.y);
				}
			}
		}
	};
	
	var getWeaponPosition = function() {
		return weaponPosition.position;
	};
	
	return extend(pane, {
		//drawWeapon: drawWeapon,
		//setWeaponLabel: setWeaponLabel,
		activeWeaponSlots: activeWeaponSlots,
		weaponPosition: weaponPosition,
		crosshairs: crosshairs,
		orientation: orientation,
		drawingOffset: drawingOffset,
		weaponSlotSize:weaponSlotSize,
		activeWeapon: activeWeapon,
		
		draw: draw,
		init: init,
		update: update,
		onWeaponSlotClicked: onWeaponSlotClicked,
		lockTarget: lockTarget,
		setCrosshair: setCrosshair,
		getWeaponSlotLocation: getWeaponSlotLocation,
		getWeaponPosition:getWeaponPosition
	});	
};


RedAlert.Battle = function() {
	var lastTime;

	var background = RedAlert.ShipBackground();
	
	var handlers = RedAlert.ClickHandlers();
	
	var playerShip = RedAlert.Ship(handlers, 0,  {x: 50, y: 150});
	
	var enemyShip = RedAlert.Ship(handlers, 1,  {x: 750, y: 50});
	
	
	var init = function() {
		
		background.init();
		var playerLayout = [
			'xxxddxxt',
			'dh w----',
			'd  eq---p',
			'dc sl---p',
			'd  -----',
			'xxxddxxt'
		];
		var playerWeapons = [new RedAlert.MissileWeapon(playerShip, 1, 10, 2, 'Archer Missile Launcher'), new RedAlert.LaserWeapon(playerShip, 2, 13, 3, 'Light Laser Cannon')];
		
		playerShip.init(playerLayout, playerWeapons);
		playerShip.draw();
		
		var enemyLayout = [
			'xxxddxxt',
			'dh w----',
			'd  eq---p',
			'dc sl---p',
			'd  -----',
			'xxxddxxt'
		];
		var enemyWeapons = [new RedAlert.MissileWeapon(enemyShip, 1, 10, 2, 'Archer Missile Launcher'), new RedAlert.LaserWeapon(enemyShip, 2, 13, 3, 'Light Laser Cannon')];
		
		enemyShip.init(enemyLayout, enemyWeapons);
		enemyShip.draw();
		
		radio('weaponslotclicked').subscribe([playerShip.onWeaponSlotClicked, playerShip]);
		radio('tileclicked').subscribe([playerShip.lockTarget, playerShip]);
		radio('tileclicked').subscribe([function(x, y) { enemyShip.setCrosshair(x, y, playerShip)}, enemyShip]);
		
	};
	
	var update = function(dt) {
		playerShip.update(dt);
		enemyShip.update(dt);
	}
	
	var render = function() {
		background.draw();
		playerShip.draw();
		enemyShip.draw();
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
		main: main,
		handlers: handlers
	}
};

