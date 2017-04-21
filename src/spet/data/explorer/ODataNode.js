import KeyNode from "./KeyNode";

/**
 * Specialized node class which can store the associated OData entity path.
 * @class
 * @name spet.data.explorer.ODataNode
 * @extends spet.data.explorer.KeyNode
 */
export default class ODataNode extends KeyNode {
	metadata = {
		properties: {
			/**
			 * The path of the associated OData entity.
			 * @type {string}
			 * @name spet.data.explorer.ODataNode#entity
			 */
			entity: {type: "string", defaultValue: ""}
		}
	}
}