

/**
 * Specialized node class which can store the associated OData entity path.
 * @class
 * @name spet.data.explorer.ODataNode
 * @extends spet.data.explorer.KeyNode
 */
sap.ui.define("spet/data/explorer/ODataNode", ["spet/data/explorer/KeyNode"], function (KeyNode) {
	"use strict";

	return KeyNode.extend("spet.data.explorer.ODataNode", {
		metadata: {
			properties: {
				/**
     * The path of the associated OData entity.
     * @type {string}
     * @name spet.data.explorer.ODataNode#entity
     */
				entity: { type: "string", defaultValue: "" }
			}
		}
	});
});
//# sourceMappingURL=ODataNode.js.map
