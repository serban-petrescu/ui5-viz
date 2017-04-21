import jQuery from "jquery.sap.global";
import Control from "sap/ui/core/Control";
import Component from "sap/ui/core/Component";
import AnnotationHelper from "sap/ui/model/odata/AnnotationHelper";
import Graph from "./Graph";
import KeyNode from "./KeyNode";
import KeyLink from "./KeyLink";

/**
 * Control for exploring the metadata of an OData model.
 * This control is based on an underlying Graph.
 * Each entity type is represented through a node and each
 * association through a link.
 * @class
 * @name spet.data.explorer.MetadataExplorer
 */
export default class MetadataExplorer extends Control {
	metadata = {
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
	}

	init() {
		this.setAggregation("_graph", new Graph({ directed: false }));
		this.attachModelContextChange(() => {
			let sName = this.getModelName(),
				oComponent = Component.getOwnerComponentFor(this),
				oModel = this.getModel(sName) || (oComponent && oComponent.getModel(sName));
			if (oModel) {
				this.build(oModel);
			}
		});
	}

	/**
	 * Builds the nodes and links for a given ODataModel.
	 * @method spet.data.explorer.MetadataExplorer#build
	 * @protected
	 * @param {sap.ui.model.odata.v2.ODataModel} oModel The OData model.
	 * @returns {void}
	 */
	build(oModel) {
		var oMeta = oModel && oModel.getMetaModel(),
			fnLabel = sPath => {
				let oMdlCtxt = oMeta.createBindingContext(sPath + "/com.sap.vocabularies.Common.v1.Label");
				return (oMdlCtxt && AnnotationHelper.format(oMdlCtxt)) || oMeta.getProperty(sPath + "/name");
			},
			fnFqName = oEnt => oEnt.namespace + "." + oEnt.name;
		oMeta.loaded().then(() => {
			var aSchemas = oMeta.getProperty("/dataServices/schema") || [],
				aEntities = [].concat(...jQuery.map(aSchemas, m => m.entityType || [])),
				aAssocs = [].concat(...jQuery.map(aSchemas, m => m.association || [])),
				oGraph = this.getAggregation("_graph");
			oGraph.removeAllNodes();
			oGraph.removeAllLinks();
			jQuery.each(aEntities, (i, oEnt) => oGraph.addNode(new KeyNode({
				key: fnFqName(oEnt),
				label: fnLabel(oMeta.getODataEntityType(fnFqName(oEnt), true))
			})));
			jQuery.each(aAssocs, (i, oA) => oGraph.addLink(new KeyLink({
				sourceKey: oA.end[0].type,
				targetKey: oA.end[1].type
			})));
			this.updateOrigins();
		});
	}

	setOrigins(aOrigins) {
		this.setProperty("origins", aOrigins);
		this.updateOrigins();
	}

	/**
	 * Updates the nodes of the graph based on the origins property.
	 * @method spet.data.explorer.MetadataExplorer#updateOrigins
	 * @protected
	 * @returns {void}
	 */
	updateOrigins() {
		var aOrigins = this.getOrigins() || [],
			oGraph = this.getAggregation("_graph");
		if (aOrigins.length) {
			jQuery.each(oGraph.getNodes() || [], (i, oN) => {
				oN.setOrigin(aOrigins.indexOf(oN.getKey()) >= 0);
				oN.setExpanded(false);
				oN.setExpandable(true);
			});
		} else {
			jQuery.each(oGraph.getNodes() || [], (i, oN) => {
				oN.setOrigin(true);
				oN.setExpanded(true);
				oN.setExpandable(false);
			});
		}
	}

	/**
	 * The renderer of the control. Wraps the graph inside a DIV.
	 * @ignore
	 * @param {sap.ui.core.RenderManager} oRM The render manager.
	 * @param {sap.ui.core.Control} oControl The explorer.
	 * @returns {void}
	 */
	renderer(oRM, oControl) {
		oRM.write("<div");
		oRM.writeControlData(oControl);
		oRM.addStyle("height", oControl.getHeight());
		oRM.addStyle("width", oControl.getWidth());
		oRM.writeStyles();
		oRM.write(">");
		oRM.renderControl(oControl.getAggregation("_graph"));
		oRM.write("</div>");
	}
}