function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Control for exploring the metadata of an OData model.
 * This control is based on an underlying Graph.
 * Each entity type is represented through a node and each
 * association through a link.
 * @class
 * @name spet.data.explorer.MetadataExplorer
 */
sap.ui.define("spet/data/explorer/MetadataExplorer", ["jquery.sap.global", "sap/ui/core/Control", "sap/ui/core/Component", "sap/ui/model/odata/AnnotationHelper", "spet/data/explorer/Graph", "spet/data/explorer/KeyNode", "spet/data/explorer/KeyLink"], function (jQuery, Control, Component, AnnotationHelper, Graph, KeyNode, KeyLink) {
	"use strict";

	return Control.extend("spet.data.explorer.MetadataExplorer", {
		metadata: {
			properties: {
				/**
     * The width of the control.
     * @type {sap.ui.core.CSSSize}
     * @default "100%"
     * @name spet.data.explorer.MetadataExplorer#width
     */
				width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },

				/**
     * The height of the control.
     * @type {sap.ui.core.CSSSize}
     * @default "100%"
     * @name spet.data.explorer.MetadataExplorer#height
     */
				height: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },

				/**
     * An array of fully qualified entity names which should serve as roots.
     * If no entities are given, then all the entities are considered to be roots.
     * @type {string[]}
     * @default []
     * @name spet.data.explorer.MetadataExplorer#origins
     */
				origins: { type: "string[]", defaultValue: [] },

				/**
     * The name of the OData model whose metadata should be used.
     * @type {string}
     * @default undefined
     * @name spet.data.explorer.MetadataExplorer#modelName
     */
				modelName: { type: "string", defaultValue: undefined }
			},
			aggregations: {
				/**
     * The undelying graph.
     * @private
     * @type {spet.data.explorer.Graph}
     * @name spet.data.explorer.MetadataExplorer#_graph
     */
				_graph: { type: "spet.data.explorer.Graph", multiple: false, visibility: "hidden" }
			},
			events: {
				/**
     * Fired when details are requested for a node (context menu request).
     * @event
     * @name spet.data.explorer.MetadataExplorer#detail
     * @property {object} dom The DOM reference of the node.
     * @property {string} entityType The fully qualified entity type name.
     */
				detail: {
					dom: { type: "object" },
					entityType: { type: "string" }
				}
			}
		},
		init: function init() {
			var _this = this;

			this.setAggregation("_graph", new Graph({ directed: false }));
			this.attachModelContextChange(function () {
				var sName = _this.getModelName(),
				    oComponent = Component.getOwnerComponentFor(_this),
				    oModel = _this.getModel(sName) || oComponent && oComponent.getModel(sName);
				if (oModel) {
					_this.build(oModel);
				}
			});
		},
		build: function build(oModel) {
			var _this2 = this;

			var oMeta = oModel && oModel.getMetaModel(),
			    fnLabel = function fnLabel(sPath) {
				var oMdlCtxt = oMeta.createBindingContext(sPath + "/com.sap.vocabularies.Common.v1.Label");
				return oMdlCtxt && AnnotationHelper.format(oMdlCtxt) || oMeta.getProperty(sPath + "/name");
			},
			    fnFqName = function fnFqName(oEnt) {
				return oEnt.namespace + "." + oEnt.name;
			};
			oMeta.loaded().then(function () {
				var _ref, _ref2;

				var aSchemas = oMeta.getProperty("/dataServices/schema") || [],
				    aEntities = (_ref = []).concat.apply(_ref, _toConsumableArray(jQuery.map(aSchemas, function (m) {
					return m.entityType || [];
				}))),
				    aAssocs = (_ref2 = []).concat.apply(_ref2, _toConsumableArray(jQuery.map(aSchemas, function (m) {
					return m.association || [];
				}))),
				    oGraph = _this2.getAggregation("_graph");
				oGraph.removeAllNodes();
				oGraph.removeAllLinks();
				jQuery.each(aEntities, function (i, oEnt) {
					return oGraph.addNode(new KeyNode({
						key: fnFqName(oEnt),
						label: fnLabel(oMeta.getODataEntityType(fnFqName(oEnt), true))
					}));
				});
				jQuery.each(aAssocs, function (i, oA) {
					return oGraph.addLink(new KeyLink({
						sourceKey: oA.end[0].type,
						targetKey: oA.end[1].type
					}));
				});
				_this2.updateOrigins();
			});
		},
		setOrigins: function setOrigins(aOrigins) {
			this.setProperty("origins", aOrigins);
			this.updateOrigins();
		},
		updateOrigins: function updateOrigins() {
			var aOrigins = this.getOrigins() || [],
			    oGraph = this.getAggregation("_graph");
			if (aOrigins.length) {
				jQuery.each(oGraph.getNodes() || [], function (i, oN) {
					oN.setOrigin(aOrigins.indexOf(oN.getKey()) >= 0);
					oN.setExpanded(false);
					oN.setExpandable(true);
				});
			} else {
				jQuery.each(oGraph.getNodes() || [], function (i, oN) {
					oN.setOrigin(true);
					oN.setExpanded(true);
					oN.setExpandable(false);
				});
			}
		},
		renderer: function renderer(oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addStyle("height", oControl.getHeight());
			oRM.addStyle("width", oControl.getWidth());
			oRM.writeStyles();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_graph"));
			oRM.write("</div>");
		}
	});
});
//# sourceMappingURL=MetadataExplorer.js.map
