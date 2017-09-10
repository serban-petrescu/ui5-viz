

/**
 * Control for modelling a graph node. Currently, the busyIndicatorDelay
 * property (inherited from the Control class) has no effect.
 * @class
 * @name spet.data.explorer.Node
 * @extends sap.ui.core.Control
 */
sap.ui.define("spet/data/explorer/Node", ["sap/ui/core/Control"], function (Control) {
	"use strict";

	return Control.extend("spet.data.explorer.Node", {
		metadata: {
			properties: {
				/**
     * A label which is displayed together with the node.
     * @type {string}
     * @name spet.data.explorer.Node#label
     */
				label: { type: "string", defaultValue: "" },

				/**
     * Flag indicating if the node is expanded.
     * @type {boolean}
     * @default true
     * @name spet.data.explorer.Node#expanded
     */
				expanded: { type: "boolean", defaultValue: true },

				/**
     * Flag indicating if the node can be expanded / collapsed.
     * @type {boolean}
     * @default true
     * @name spet.data.explorer.Node#expandable
     */
				expandable: { type: "boolean", defaultValue: true },

				/**
     * Flag indicating if only the label of the node should be displayed.
     * @type {boolean}
     * @default false
     * @name spet.data.explorer.Node#labelOnly
     */
				labelOnly: { type: "boolean", defaultValue: false }
			},
			events: {
				/**
     * Fired when the expansion state is changed (the node is expanded / collapsed).
     * @event
     * @name spet.data.explorer.Node#expand
     */
				expand: {},

				/**
     * Fired when node details are requested (via context menu request).
     * @event
     * @name spet.data.explorer.Node#detail
     * @property {object} dom The DOM reference of the node.
     */
				detail: { dom: { type: "object" } }
			}
		},
		setBusy: function setBusy(bBusy) {
			this.setProperty("busy", bBusy);
		}
	});
});
//# sourceMappingURL=Node.js.map
