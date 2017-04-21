import KeyLink from "./KeyLink";
import ODataNode from "./ODataNode";

/**
 * Specialized link which can retrieve the linked OData entity paths.
 * @class
 * @name spet.data.explorer.ODataLink
 * @extends spet.data.explorer.KeyLink
 */
export default class ODataLink extends KeyLink {
	metadata = { }

	/**
	 * Retrieves the path of the source entity.
	 * @method spet.data.explorer.ODataLink#getSourceEntity
	 * @returns {string} The path.
	 */
	getSourceEntity() {
		return this.getEntity(this.getSource());
	}

	/**
	 * Retrieves the path of the target entity.
	 * @method spet.data.explorer.ODataLink#getTargetEntity
	 * @returns {string} The path.
	 */
	getTargetEntity() {
		return this.getEntity(this.getTarget());
	}

	/**
	 * Gets the OData entity path associated with the given node.
	 * @method spet.data.explorer.ODataLink#getEntity
	 * @protected
	 * @param {string} sId The node's ID.
	 * @returns {string} The entity path.
	 */
	getEntity(sId) {
		var oControl = sap.ui.getCore().byId(sId);
		if (oControl && oControl instanceof ODataNode) {
			return oControl.getEntity();
		}
		return null;
	}
}
