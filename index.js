var postcss = require('./lib.js');

function walk(node, types) {
	var type  = node.type || '';
	var nodes = node.nodes || [];
	var index;

	if (node._observers && node._observers[type] || types[type]) {
		var target = node;

		while (target) {
			var listeners = target._observers && target._observers[type];

			if (listeners) {
				var listener;

				index = -1;

				while (listener = listeners[++index]) listener({
					current: target,
					target:  node
				});
			}

			target = target.parent;
		}
	}

	if (nodes && nodes.length) {
		var childNode;

		index = -1;

		while (childNode = nodes[++index]) {
			walk(childNode, types);
		}
	}
}

module.exports = postcss.plugin('csse', function () {
	return function (root) {
		root.on('rule').filter(function (event) {
			return event.target.selector[0] === 'h';
		}).each(function (event) {
			console.log(event.target.selector);
		});

		// ---
		var types = {}, key; for (key in root._observers) types[key] = true; walk(root, types);
	};
});
