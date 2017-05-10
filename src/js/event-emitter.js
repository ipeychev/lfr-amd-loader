'use strict';

/**
 * Creates an instance of EventEmitter class.
 *
 * @constructor
 */
function EventEmitter() {
	this._events = {};
}

EventEmitter.prototype = {
	constructor: EventEmitter,

	/**
     * Adds event listener to an event.
     *
     * @param {string} event The name of the event.
     * @param {Function} callback Callback method to be invoked when event is being emitted.
     */
	on: function(event, callback) {
		var listeners = (this._events[event] = this._events[event] || []);

		listeners.push(callback);
	},

	/**
     * Removes an event from the list of event listeners to some event.
     *
     * @param {string} event The name of the event.
     * @param {function} callback Callback method to be removed from the list of listeners.
     */
	off: function(event, callback) {
		var listeners = this._events[event];

		if (listeners) {
			var callbackIndex = listeners.indexOf(callback);

			if (callbackIndex > -1) {
				listeners.splice(callbackIndex, 1);
			} else {
				console.warn(
					'Off: callback was not removed: ' + callback.toString()
				);
			}
		} else {
			console.warn('Off: there are no listeners for event: ' + event);
		}
	},

	/**
     * Emits an event. The function calls all registered listeners in the order they have been added. The provided args
     * param will be passed to each listener of the event.
     *
     * @param {string} event The name of the event.
     * @param {object} args Object, which will be passed to the listener as only argument.
     */
	emit: function(event, args) {
		var listeners = this._events[event];

		if (listeners) {
			// Slicing is needed to prevent the following situation:
			// A listener is being invoked. During its execution, it may
			// remove itself from the list. In this case, for loop will
			// be damaged, since i will be out of sync.
			listeners = listeners.slice(0);

			for (var i = 0; i < listeners.length; i++) {
				var listener = listeners[i];

				listener.call(listener, args);
			}
		} else {
			console.warn('No listeners for event: ' + event);
		}
	},
};
