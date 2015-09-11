var postcss = require('postcss');
var Comment = postcss.comment().constructor;
var Node    = Comment.prototype.constructor;

// delete comment constructor
delete Comment.prototype.constructor;

// capture node constructor
Node = Comment.prototype.constructor;

// restore comment constructor
Comment.prototype.constructor = Comment;

function validateCallback(callback, name) {
	if (!(callback instanceof Function || callback instanceof EventObserver)) {
		throw new TypeError(name + '() requires a valid callback.');
	}
}

function validateTarget(target) {
	if (target instanceof Node || target instanceof EventObserver) {
		return target;
	} else {
		throw new TypeError('EventObserver requires a valid target.');
	}
}

function activate(observer) {
	if (!observer._activated) {
		observer._activated = true;

		if (observer._target instanceof EventObserver) {
			activate(observer._target);
		} else if (observer._target instanceof Node) {
			observer._target._observers = observer._target._observers || {};
			observer._target._observers[observer._type] = observer._target._observers[observer._type] || [];
			observer._target._observers[observer._type].push(observer._listener);
			// observer._target.addEventListener(observer._type, observer._listener);
		}

		return true;
	}

	return false;
}

function observe(type) {
	return new EventObserver(this, type);
}

function deactivate(observer) {
	if (observer._activated) {
		observer._activated = false;

		observer._on.splice(0);

		if (observer._target instanceof EventObserver) {
			deactivate(observer._target);
		} else if (observer._target instanceof Node) {
			console.log('deactivate:'+observer._type);
			// observer._target.removeEventListener(observer._type, observer._listener);
		}

		return true;
	}

	return false;
}

function add(observer, callback) {
	observer._on.push(callback);
}

function fire(observer, event) {
	observer._on.forEach(function (callback) {
		callback.call(observer, event);
	});
}

function init(target, type) {
	var self = validateTarget(this);

	self._on = [];

	self._target = target;
	self._type = type;

	self._listener = function (event) {
		fire(self, event);
	};
}

// ========================================================================== */

function EventObserver(target) {
	init.apply(this, arguments);
}

EventObserver.prototype = {
	// <EventObserver>
	constructor: EventObserver,

	// <EventObserver>.disconnect
	disconnect: function disconnect() {
		var self = validateTarget(this);

		deactivate(self);

		return self;
	},

	// <EventObserver>.filter
	filter: function filter(callback) {
		var
		self = validateTarget(this),
		next = new EventObserver(self);

		validateCallback(callback, 'filter');

		activate(next);

		add(self, function (event) {
			if (callback.call(self, event)) {
				fire(next, event);
			}
		});

		return next;
	},

	// <EventObserver>.map
	map: function map(callback) {
		var
		self = validateTarget(this),
		next = new EventObserver(self);

		validateCallback(callback, 'map');

		activate(next);

		add(self, function (event) {
			var value = callback.call(self, event);

			if (value instanceof EventObserver) {
				activate(value);

				add(value, function (event) {
					fire(next, event);
				});
			} else {
				fire(next, value);
			}
		});

		return next;
	},

	// <EventObserver>.each
	each: function each(callback) {
		var
		self = validateTarget(this),
		next = new EventObserver(self);

		validateCallback(callback, 'each');

		activate(self);

		add(self, callback);

		return self;
	},

	// <EventObserver>.until
	until: function until(callback) {
		var self = validateTarget(this);

		validateCallback(callback, 'until');

		activate(self);

		if (callback instanceof EventObserver) {
			activate(callback);

			add(callback, function () {
				deactivate(callback);
				deactivate(self);
			});
		} else {
			add(self, function (event) {
				value = callback.call(self, event);

				if (value) {
					deactivate(self);
				}
			});
		}

		return self;
	}
};

Node.prototype.on = function on(type) {
	return new EventObserver(this, type);
};

module.exports = postcss;
