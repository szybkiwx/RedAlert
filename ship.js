RedAlert.Bullet = function(weapon, position) {
	this.weapon = weapon;
	this.position = position
	//tells if bullet went pass screen split
	this.passSplit = false;
	this.direction = new RedAlert.Point(1, 0);
	
	this.update = function(dt) {
		this.position.x += this.weapon.bulletSpeed * dt * this.direction.x;
		this.position.y += this.weapon.bulletSpeed * dt * this.direction.y;
	}
	
	this.crossSplit = function(x, y) {
		this.passSplit = true;
		this.position.x = x;
		this.position.y = y;
		var v = new RedAlert.Point(this.weapon.target.x - this.position.x, this.weapon.target.y - this.position.y);
		var modv = Math.sqrt(x * x + y * y);
		v.x /= modv;
		v.y /= modv;
		
		this.direction = v;
	}
};

RedAlert.Weapon = function(ship, powerConsumption, powerUpTime, damage, label) {

	this.ship = ship;
	this.powerConsumption = powerConsumption;
	this.powerUpTime = powerUpTime;
	this.damage = damage;
	this.label = label;
	this.powerUp = 0;
	this.selected = false;
	this.target = null;
	this.bulletImg = '';
	this.bulletSpeed = 0;
}

RedAlert.Weapon.prototype.fire = function() {
	//this.sprite = new Sprite(this.spriteImg, [this.ship.getWeaponPosition().x, this.ship.getWeaponPosition().y], [12, 12], 10);
	var bullet = new RedAlert.Bullet(this, new RedAlert.Point(this.ship.getWeaponPosition().x, this.ship.getWeaponPosition().y));
	this.powerUp = 0;
	
	return bullet;
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

};

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
	this.bulletSpeed = 1000;
}

RedAlert.LaserWeapon.prototype = new RedAlert.Weapon();
RedAlert.LaserWeapon.prototype.constructor = RedAlert.LaserWeapon;

RedAlert.MissileWeapon = function(ship, powerConsumption, powerUpTime, damage, label) {
	RedAlert.Weapon.call(this, ship, powerConsumption, powerUpTime, damage, label);
	this.bulletImg = 'images/ship/laserbullet.png';
	this.bulletSpeed = 500;
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


RedAlert.Ship = function(inHandlers, inOrientation, inHullState, inDrawingOffset) {
	var pane = RedAlert.Pane();
	
	var maxHullState, hullState = maxHullState = inHullState;
	
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
		
		RedAlert.Rectangle.call(this, new RedAlert.Point(finalPosition.x, finalPosition.y), finalPosition.sizex, finalPosition.sizey); 
		var self = this;
		
		handlers.registerRect(finalPosition.x, finalPosition.y, finalPosition.sizex, finalPosition.sizey, function(x, y) {
			if(self.ship.orientation === 1) {
				radio('tileclicked').broadcast(x, y);
			}
		});
	};

	Tile.prototype = new RedAlert.Rectangle();
	Tile.prototype.constructor = Tile;
	
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
	
	var WeaponSlot = function(point, width, height) {
		RedAlert.Rectangle.call(this, point, width, height);
		this.weapon = null;
	};
	
	WeaponSlot.prototype = new RedAlert.Rectangle();
	WeaponSlot.prototype.constructor = WeaponSlot;
	
	WeaponSlot.prototype.registerClick = function() {
		handlers.registerRect(this.point.x, this.point.y, this.width, this.height, function(x, y) {
			radio('weaponslotclicked').broadcast(x, y);

		});
		
	};
	
	var HealthBar = function(position) {
		var ctx = pane.context();
		
		this.draw = function() {
			ctx.beginPath();
			ctx.strokeStyle = 'yellow';
			for(var i = 0; i < maxHullState; i++) {
				ctx.rect(position.x + i * 15, position.y, 15, 15 );
			}
			ctx.stroke();
			
			ctx.beginPath();
			for(var i = 0; i < hullState; i++) {
				if(i > Math.floor(maxHullState * 3 / 4)) {
					ctx.fillStyle = 'green';
				}
				else if(i > Math.floor(maxHullState * 1 / 4)) {
					ctx.fillStyle = 'orange';
				}
				else {
					ctx.fillStyle = 'red';
				}
				ctx.rect(position.x + 1 + i * 15, position.y + 1, 14, 14 );
				ctx.fill();
			}
			
		}
	};

	var tiles = [];
	var context = document.getElementById('gameWindow').getContext("2d");
	
	var weaponSlots = [null, null, null, null];
	
	var crosshairs = [null, null, null, null];
	
	//tile which serves as bullet starting point
	var weaponPosition = null;
	
	var bullets = [];
	
	var healthBar = null;
	
	var explosions = [];
	
	var init = function(newLayout, weapons, healthBarPosition) {
		layout = newLayout;
		healthBar = new HealthBar(healthBarPosition);
		var top = pane.canvasSize().height - drawingOffset.y;
		var left = drawingOffset.x;
		
		for(var i = 0; i < weaponSlotCapacity; i++) {
			weaponSlots[i] = new WeaponSlot(new RedAlert.Point(left, top), weaponSlotSize.x, weaponSlotSize.y);
			if(i < weapons.length) {
				weaponSlots[i].weapon = weapons[i];
				if(orientation === 0) {
					weaponSlots[i].registerClick();
				}
			}
			
			left += weaponSlotSize.x;
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
				bullets.push(weapon.fire());
			}
		});
	};
	
	var lockTarget = function(x, y) {
		var p = new RedAlert.Point(x, y);
		this.activeWeapon.target = p;
		if(this.activeWeapon.isPowered()) {
			this.bullets.push(this.activeWeapon.fire());
		}
	};
	
	var setCrosshair = function(x, y, friendShip) {
		var weaponSlots = friendShip.activeWeaponSlots();
		
		var p = new RedAlert.Point(x, y);
		for(var i = 0; i < weaponSlots.length; i++) {
			var slot = weaponSlots[i];
			if(slot.weapon.selected) {
				this.crosshairs[i] = p;
				pane.canvas().style.cursor = "default";
				break;
			}

		}
	}
	
	var clearCrosshair = function(point) {
		var weaponSlots = friendShip.activeWeaponSlots();
		for(var i = weaponSlots.length - 1; i >= 0 ; i--) {
			var weapon = weaponSlots[i];
			if(weapon.target.equals(this.crosshairs[i])) {
				this.crosshairs.remove(i);
				break;
			}
		}
	}
	
	var drawWeaponSlot = function(top, left) {
		//var context = pane.context();
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

		for(var i = 0; i < weapons.length; i++) {
			var slot = weapons[i];
			if(slot.pointIn(new RedAlert.Point(clickX, clickY))) {
				slot.weapon.selected = true;
				this.activeWeapon = slot.weapon;
				this.canvas().style.cursor = "url('images/ship/crosshair.png'), auto";
			}
			else {
				slot.weapon.selected = false;
				
			}
		}
	};
	
	var activeWeaponSlots = function() {
		return weaponSlots.filter(function(val) {return val.weapon != null;});
	};
	
	var update = function(dt) {
		var slots = activeWeaponSlots();
		for(var i = 0; i < slots.length; i++) {
			var slot = slots[i];
			slot.weapon.update(dt);
		}
		
		for(var i = explosions.length - 1; i >= 0 ; i--) {
			var sprite = explosions[i].sprite;
			sprite.update(dt);
			if(sprite.done === true) {
				explosions.remove(i);
			}
		}
	};
	
	var getWeaponSlotLocation = function(slotIndex) {
		var top = pane.canvasSize().height - drawingOffset.y;
		var left = drawingOffset.x
		
		return new RedAlert.Point(top, left + slotIndex * weaponSlotSize.x);
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
					scalex = tileConfigs[tile.symbol]. size.w;
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
				if(current.weapon == null) {
					return lastValue;
				}			
				return Math.max(lastValue, current.weapon.powerUpTime)
			}, 0);
			
			for(var i  = 0; i < weaponSlots.length; i++) {
				var pos = getWeaponSlotLocation(i);
				drawWeaponSlot(pos.x, pos.y );
				var slot = weaponSlots[i];
				if(slot.weapon != null) {
					slot.weapon.draw(maxWeaponPowerBar, pos.x, pos.y);
				}
			}
		}
		
		healthBar.draw();
		for(var i = 0; i < explosions.length; i++) {
			context.save();
			var x = explosions[i].position.x, y = explosions[i].position.y;
			
			context.translate(x, y);
			explosions[i].sprite.render(context);
			context.restore();
		}
	};
	
	var getWeaponPosition = function() {
		return weaponPosition.position;
	};
	
	var getBullets = function() {
		return bullets;
	};
	
	var damage = function(amnt) {
		if(hullState - amnt >= 0) {
			hullState-= amnt;
		}
		else {
			hullState = 0;
		}
	};
	
	var explosion = function(hitPosition) {
		var x = hitPosition.x, y = hitPosition.y;
		for(var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			var position = tile.getPosition();
			if(x >= position.x && x < position.x + tileSize.x
				&& y >= position.y && y < position.y + tileSize.y) {
				var sprite = new Sprite('images/ship/explosion-animation.png', 
					[0, 0],
					[20, 20], 
					10, 
					[0, 1, 2, 3, 4, 5, 6, 7],
					'horizontal',
					true);
				explosions.push({ sprite: sprite, position: new RedAlert.Point(position.x, position.y)});
				break;
			}
			
		}
	}
	
	return extend(pane, {
		activeWeaponSlots: activeWeaponSlots,
		weaponPosition: weaponPosition,
		crosshairs: crosshairs,
		orientation: orientation,
		drawingOffset: drawingOffset,
		weaponSlotSize:weaponSlotSize,
		activeWeapon: activeWeapon,
		bullets: bullets,
		
		draw: draw,
		init: init,
		update: update,
		onWeaponSlotClicked: onWeaponSlotClicked,
		lockTarget: lockTarget,
		setCrosshair: setCrosshair,
		getWeaponSlotLocation: getWeaponSlotLocation,
		getWeaponPosition: getWeaponPosition,
		getBullets: getBullets,
		applyDamage: damage,
		explosion: explosion
	});	
};


RedAlert.Battle = function() {
	var lastTime;

	var pane = RedAlert.Pane();
	
	var background = RedAlert.ShipBackground();
	
	var handlers = RedAlert.ClickHandlers();
	
	var playerShip = RedAlert.Ship(handlers, 0, 30, new RedAlert.Point(50, 150));
	
	var enemyShip = RedAlert.Ship(handlers, 1, 10, new RedAlert.Point(750, 50));
	
	var canvasSize = pane.canvasSize();
	
	var split = [{x: 600, y: 0}, {x: 600, y: canvasSize.height}]; 
	
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
		
		playerShip.init(playerLayout, playerWeapons, new RedAlert.Point(50, 600));
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
		
		enemyShip.init(enemyLayout, enemyWeapons, new RedAlert.Point(750, 10));
		enemyShip.draw();
		
		radio('weaponslotclicked').subscribe([playerShip.onWeaponSlotClicked, playerShip]);
		radio('tileclicked').subscribe([playerShip.lockTarget, playerShip]);
		radio('tileclicked').subscribe([function(x, y) { enemyShip.setCrosshair(x, y, playerShip)}, enemyShip]);
		
	};
	
	var drawSplit = function() {
		var ctx = pane.context();
		ctx.beginPath();
		ctx.fillStyle = 'white';
		ctx.rect(split[0].x, split[0].y, 5, canvasSize.height);
		ctx.fill();
	};
	
	var update = function(dt) {
		playerShip.update(dt);
		
		for(var i = playerShip.bullets.length - 1; i >= 0 ; i--) {
			var bullet = playerShip.bullets[i];
			bullet.update(dt);
			if(bullet.position.x > split[0].x && bullet.passSplit === false) {
				bullet.crossSplit(split[0].x, split[1].y);
			}
			
			//shot reached destination
			if(bullet.position.getDistance(bullet.weapon.target) < 10) {
				var target = bullet.weapon.target;
				bullet.weapon.target = null;
				playerShip.bullets.remove(i);
				enemyShip.applyDamage(bullet.weapon.damage);
				enemyShip.explosion(target);
				playerShip.activeWeapon = null;
				
			}
		}
	
		enemyShip.update(dt);
	}
	
	var render = function() {
		background.draw();
		
		playerShip.draw();
		drawSplit();
		
		enemyShip.draw();
		
		var ctx = pane.context();	
		for(var i = 0; i < playerShip.bullets.length; i++) {
			var bullet = playerShip.bullets[i];
			ctx.drawImage(resources.get(bullet.weapon.bulletImg), bullet.position.x, bullet.position.y); 
		}
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

