

/**
 * Specialized link which can retrieve the linked OData entity paths.
 * @class
 * @name spet.data.explorer.ODataLink
 * @extends spet.data.explorer.KeyLink
 */
sap.ui.define("spet/data/explorer/ODataLink", ["spet/data/explorer/KeyLink", "spet/data/explorer/ODataNode"], function (KeyLink, ODataNode) {
	"use strict";

	return KeyLink.extend("spet.data.explorer.ODataLink", {
		metadata: {},
		getSourceEntity: function getSourceEntity() {
			return this.getEntity(this.getSource());
		},
		getTargetEntity: function getTargetEntity() {
			return this.getEntity(this.getTarget());
		},
		getEntity: function getEntity(sId) {
			var oControl = sap.ui.getCore().byId(sId);
			if (oControl && oControl instanceof ODataNode) {
				return oControl.getEntity();
			}
			return null;
		}
	});
});
//# sourceMappingURL=ODataLink.js.map
