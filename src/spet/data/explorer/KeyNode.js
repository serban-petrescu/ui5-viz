

/**
 * A node subclass which also has a unique key and a flag
 * indicating if it is an origin node.
 * @class
 * @name spet.data.explorer.KeyNode
 * @extends spet.data.explorer.Node
 */
sap.ui.define("spet/data/explorer/KeyNode", ["spet/data/explorer/Node"], function (Node) {
	"use strict";

	return Node.extend("spet.data.explorer.KeyNode", {
		metadata: {
			properties: {
				/**
     * The unique key of the node.
     * @name spet.data.explorer.KeyNode#key
     * @type {string}
     */
				key: { type: "string", defaultValue: "" },
				/**
     * Flag indicating if the node is an origin node.
     * @name spet.data.explorer.KeyNode#origin
     * @type {boolean}
     * @default false
     */
				origin: { type: "boolean", defaultValue: false }
			}
		},
		setParent: function setParent(oParent) {
			Node.prototype.setParent.apply(this, [oParent]);
			this.update();
		},
		setOrigin: function setOrigin(bIsRoot) {
			this.setProperty("origin", bIsRoot);
			this.update();
		},
		update: function update() {
			if (this.getParent()) {
				if (this.getOrigin()) {
					this.getParent().addOrigin(this);
				} else {
					this.getParent().removeOrigin(this);
				}
			}
		}
	});
});
//# sourceMappingURL=KeyNode.js.map
