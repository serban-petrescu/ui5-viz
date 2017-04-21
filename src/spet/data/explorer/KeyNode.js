import Node from "./Node";

/**
 * A node subclass which also has a unique key and a flag
 * indicating if it is an origin node.
 * @class
 * @name spet.data.explorer.KeyNode
 * @extends spet.data.explorer.Node
 */
export default class KeyNode extends Node {
	metadata = {
		properties: {
			/**
			 * The unique key of the node.
			 * @name spet.data.explorer.KeyNode#key
			 * @type {string}
			 */
			key: {type: "string", defaultValue: ""},
			/**
			 * Flag indicating if the node is an origin node.
			 * @name spet.data.explorer.KeyNode#origin
			 * @type {boolean}
			 * @default false
			 */
			origin: {type: "boolean", defaultValue: false}
		}
	}

	setParent(oParent) {
		super.setParent(oParent);
		this.update();
	}

	setOrigin(bIsRoot) {
		this.setProperty("origin", bIsRoot);
		this.update();
	}

	/**
	 * Updates the parent graph's origins association based on the
	 * current value of the origin flag.
	 * @method spet.data.explorer.KeyNode#update
	 * @protected
	 * @returns {void}
	 */
	update() {
		if (this.getParent()) {
			if (this.getOrigin()) {
				this.getParent().addOrigin(this);
			} else {
				this.getParent().removeOrigin(this);
			}
		}
	}
}