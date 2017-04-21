import Element from "sap/ui/core/Element";

/**
 * Element which describes an edge between two graph nodes.
 * If the parent graph is not directed, the source / target nodes
 * are interchangeable.
 * @class
 * @name spet.data.explorer.Link
 * @extends sap.ui.core.Element
 */
export default class Link extends Element {
	metadata = {
		properties: {
			/**
			 * A label to be displayed on the link.
			 * @type {string}
			 * @name spet.data.explorer.Link#label
			 */
			label: { type: "string", defaultValue: "" }
		},
		associations: {
			/**
			 * The associated source node.
			 * @type {spet.data.explorer.Node}
			 * @name spet.data.explorer.Link#source
			 */
			source: { type: "spet.data.explorer.Node", multiple: false },
			/**
			 * The associated target node.
			 * @type {spet.data.explorer.Node}
			 * @name spet.data.explorer.Link#source
			 */
			target: { type: "spet.data.explorer.Node", multiple: false }
		}
	};
}
