

/**
 * Link which can refer its nodes by using their keys.
 * The inherited associations should not be used directly.
 * @class
 * @name spet.data.explorer.KeyLink
 * @extends spet.data.explorer.Link
 */
sap.ui.define("spet/data/explorer/KeyLink", ["spet/data/explorer/Link"], function (Link) {
	"use strict";

	return Link.extend("spet.data.explorer.KeyLink", {
		metadata: {
			properties: {
				/**
     * The key of the source node.
     * @name spet.data.explorer.KeyLink#sourceKey
     * @type {string}
     */
				sourceKey: { type: "string", defaultValue: "" },
				/**
     * The key of the target node.
     * @name spet.data.explorer.KeyLink#targetKey
     * @type {string}
     */
				targetKey: { type: "string", defaultValue: "" }
			}

			/**
    * Finds the graph node which has the given key.
    * @method spet.data.explorer.KeyLink#findNodeByKey
    * @param {spet.data.explorer.Graph} oGraph The parent graph.
    * @param {string} sKey The key used for the search.
    * @returns {spet.data.explorer.Node|null} The found node or null if nothing was found.
    */
		},
		findNodeByKey: function findNodeByKey(oGraph, sKey) {
			var aNodes = oGraph.getNodes() || [];
			for (var i = 0; i < aNodes.length; ++i) {
				if (aNodes[i].getKey && aNodes[i].getKey() === sKey) {
					return aNodes[i];
				}
			}
			return null;
		},
		setSourceKey: function setSourceKey(sKey) {
			this.setProperty("sourceKey", sKey);
			this.setAssociation("source", null);
		},
		setTargetKey: function setTargetKey(sKey) {
			this.setProperty("targetKey", sKey);
			this.setAssociation("target", null);
		},
		getSource: function getSource() {
			var oSource = this.getAssociation("source");
			if (oSource) {
				return oSource;
			} else if (this.getParent()) {
				oSource = this.findNodeByKey(this.getParent(), this.getSourceKey());
				this.setAssociation("source", oSource);
				return oSource ? oSource.getId() : null;
			}
			return null;
		},
		getTarget: function getTarget() {
			var oTarget = this.getAssociation("target");
			if (oTarget) {
				return oTarget;
			} else if (this.getParent()) {
				oTarget = this.findNodeByKey(this.getParent(), this.getTargetKey());
				this.setAssociation("target", oTarget);
				return oTarget ? oTarget.getId() : null;
			}
			return null;
		}
	});
});
//# sourceMappingURL=KeyLink.js.map
