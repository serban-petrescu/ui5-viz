import jQuery from "jquery.sap.global";
import Control from "sap/ui/core/Control";
import Component from "sap/ui/core/Component";
import AnnotationHelper from "sap/ui/model/odata/AnnotationHelper";
import Graph from "./Graph";
import ODataNode from "./ODataNode";
import ODataLink from "./ODataLink";

/**
 * Control for exploring the content of an OData model.
 * This explorer starts from a single entity root node.
 * Each node can either be an entity or a multi-cardinality
 * navigation.
 * @class
 * @name spet.data.explorer.ODataExplorer
 */
export default class ODataExplorer extends Control {
	metadata = {
		properties: {
			/**
			 * The width of the control.
			 * @type {sap.ui.core.CSSSize}
			 * @default "100%"
			 * @name spet.data.explorer.ODataExplorer#width
			 */
			width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },

			/**
			 * The height of the control.
			 * @type {sap.ui.core.CSSSize}
			 * @default "100%"
			 * @name spet.data.explorer.ODataExplorer#height
			 */
			height: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },

			/**
			 * The path of the root entity.
			 * @type {string}
			 * @name spet.data.explorer.ODataExplorer#path
			 */
			path: { type: "string", defaultValue: "" },

			/**
			 * The name of the OData model whose metadata should be used.
			 * @type {string}
			 * @default undefined
			 * @name spet.data.explorer.ODataExplorer#modelName
			 */
			modelName: { type: "string", defaultValue: undefined },

			/**
			 * The maximum number of entities from a multi-cardinality
			 * navigation which should be loaded at once. If further
			 * entities are available, a specialized "More" node is
			 * shown.
			 * @type {int}
			 * @default 20
			 * @name spet.data.explorer.ODataExplorer#growingThreshold
			 */
			growingThreshold: { type: "int", defaultValue: 20 }
		},
		aggregations: {
			/**
			 * The undelying graph.
			 * @private
			 * @type {spet.data.explorer.Graph}
			 * @name spet.data.explorer.ODataExplorer#_graph
			 */
			_graph: { type: "spet.data.explorer.Graph", multiple: false, visibility: "hidden" }
		},
		events: {
			/**
			 * Fired before an entity is added to the explorer.
			 * Preventing the default of this event will cause the explorer to not add the node.
			 * @event
			 * @name spet.data.explorer.ODataExplorer#addEntity
			 * @property {string} entityPath The model path of the entity.
			 */
			addEntity: {
				entityPath: { type: "string" }
			},

			/**
			 * Fired before a mutiple-cardinality navigation of an entity is added to the explorer.
			 * Preventing the default of this event will cause the explorer to not add the node.
			 * @event
			 * @name spet.data.explorer.ODataExplorer#addNavigation
			 * @property {string} navigationName The name of the navigation property.
			 * @property {string} entityPath The model path of the entity.
			 */
			addNavigation: {
				navigationName: { type: "string" },
				entityPath: { type: "string" }
			},

			/**
			 * Fired when details are requested for an entity node (context menu request).
			 * @event
			 * @name spet.data.explorer.ODataExplorer#detailEntity
			 * @property {object} dom The DOM reference of the node.
			 * @property {string} entityType The fully qualified entity type name.
			 */
			detailEntity: {
				dom: { type: "object" },
				entityPath: { type: "string" }
			},

			/**
			 * Fired when details are requested for a navigation node (context menu request).
			 * @event
			 * @name spet.data.explorer.ODataExplorer#detailNavigation
			 * @property {object} dom The DOM reference of the node.
			 * @property {string} navigationName The name of the navigation property.
			 * @property {string} entityType The fully qualified entity type name.
			 */
			detailNavigation: {
				dom: { type: "object" },
				navigationName: { type: "string" },
				entityPath: { type: "string" }
			}
		}
	}

	/**
	 * Promise which is resolved when the model is available.
	 * @private
	 * @name spet.data.explorer.ODataExplorer#_modelPromise
	 */
	_modelPromise = null

	/**
	 * Links two nodes.
	 * @private
	 * @method spet.data.explorer.ODataExplorer#_link
	 * @param {spet.data.explorer.Graph} oGraph The graph control.
	 * @param {string} sSource The source node key.
	 * @param {string} sTarget The target node key.
	 * @param {string=} sLabel An optional label to be shown on the link.
	 * @returns {spet.data.explorer.ODataLink} The created link.
	 */
	_link(oGraph, sSource, sTarget, sLabel) {
		let oLink = new ODataLink({
			sourceKey: sSource,
			targetKey: sTarget,
			label: sLabel || ""
		});
		oGraph.addLink(oLink);
		return oLink;
	}

	/**
	 * Adds an aggregation node for a multiple-cardinality navigation of an entity.
	 * @private
	 * @method spet.data.explorer.ODataExplorer#_aggregation
	 * @param {sap.ui.model.odata.v2.ODataModel} oModel The OData model.
	 * @param {spet.data.explorer.Graph} oGraph The Graph control.
	 * @param {string} sPath The path towards the owner entity.
	 * @param {string} sNavigation The navigation name.
	 * @param {string=} sLabel The label to be displayed on the link.
	 * @returns {Promise} A promise resolved when the node is added to the graph.
	 */
	_aggregation(oModel, oGraph, sPath, sNavigation, sLabel) {
		let sFull = sPath + "/" + sNavigation,
			oBinding = oModel.bindList(sFull).initialize(),
			iIndex = 0,
			iCount = this.getGrowingThreshold(),
			oDeferred = new jQuery.Deferred(),
			oMoreNode,
			oMoreLink;

		let fnLink = oChild => oChild && this._link(oGraph, sFull, oChild.getKey());

		/**
		 * Creates the navigation node.
		 * @ignore
		 */
		let fnNode = () => {
			let oNode = new ODataNode({
				key: sFull,
				expanded: true,
				label: sLabel,
				entity: sPath
			});
			oNode.attachEvent("detail", oE => {
				this.fireEvent("detailNavigation", {
					dom: oE.getParameter("dom"),
					entityPath: sPath,
					navigationName: sNavigation
				});
			});
			oGraph.addNode(oNode);
			oDeferred.resolve(oNode);
		};

		/**
		 * Creates an entity node for each child entity.
		 * @param {sap.ui.model.Context[]} aContexts The binding contexts of the children.
		 * @ignore
		 */
		let fnChildren = aContexts => {
			jQuery.each(aContexts, (ii, oC) => this._entity(oModel, oGraph, oC.getPath(), false).then(fnLink));
		};

		/**
		 * Handles the functionality of loading more children (similar to the growing list).
		 * @param {int} iLength The complete length of the OData collection.
		 * @ignore
		 */
		let fnMore = (iLength) => {
			if (oMoreNode) {
				oMoreNode.setBusy(false);
				oGraph.removeNode(oMoreNode);
				oGraph.removeLink(oMoreLink);
			}
			iIndex += iCount;
			if (iIndex < iLength) {
				let sMoreKey = sFull + "/__more";
				oMoreNode = new ODataNode({
					key: sMoreKey,
					label: sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("LOAD_MORE_DATA"),
					expanded: false,
					entity: sPath,
					expand: fnRequest
				});
				oMoreLink = new ODataLink({
					sourceKey: sFull,
					targetKey: sMoreKey
				});
				oGraph.addNode(oMoreNode);
				oGraph.addLink(oMoreLink);
			}
		};

		/**
		 * Handles new received data.
		 * @ignore
		 */
		let fnData = () => {
			let iLength = oBinding.getLength();
			if (!iLength) {
				oBinding.destroy();
				oDeferred.resolve();
			} else {
				if (iIndex === 0) {
					fnNode();
				}
				fnChildren(oBinding.getContexts(iIndex, iCount));
				fnMore(iLength);
			}
		};

		/**
		 * Triggers a new backend request (if needed).
		 * @ignore
		 */
		let fnRequest = () => {
			var oResult = oBinding.getContexts(iIndex, iCount);
			if (oResult && !oResult.dataRequested) {
				fnData();
			} else if (oMoreNode) {
				oMoreNode.setBusy(true);
			}
		};

		oBinding.attachDataReceived(fnData);
		fnRequest();

		return oDeferred.promise();
	}

	/**
	 * Adds an entity node.
	 * @private
	 * @method spet.data.explorer.ODataExplorer#_entity
	 * @param {sap.ui.model.odata.v2.ODataModel} oModel The OData model.
	 * @param {spet.data.explorer.Graph} oGraph The Graph control.
	 * @param {string} sPath The path towards the entity.
	 * @param {boolean} bOrigin Flag indicating if the node is a root.
	 * @returns {Promise} A promise resolved when the node is added to the graph.
	 */
	_entity(oModel, oGraph, sPath, bOrigin) {
		let oMeta = oModel && oModel.getMetaModel(),
			oDeferred = new jQuery.Deferred();

		/**
		 * Gets the title of a node (based on annotations or entity type name).
		 * @returns {string} The title of the node.
		 * @ignore
		 */
		let fnTitle = () => {
			let oMetaCtxt = oMeta.getMetaContext(sPath),
				sAnnotationPath = oMetaCtxt.getPath() + "/com.sap.vocabularies.UI.v1.HeaderInfo/Title",
				oMdlCtxt = oMeta.createBindingContext(sAnnotationPath);
			return (oMdlCtxt && AnnotationHelper.format(oMdlCtxt)) || oMetaCtxt.getProperty("name");
		};

		/**
		 * Creates a link between the current entity and a child node.
		 * @param {spet.data.explorer.Node} oChild The child node.
		 * @param {string=} sLabel Optional label for the created link.
		 * @returns {spet.data.explorer.Link|null} The created link.
		 * @ignore
		 */
		let fnLink = (oChild, sLabel) => oChild && this._link(oGraph, sPath, oChild.getKey(), sLabel);

		/**
		 * Retrieves the label for a navigation.
		 * @param {string} sNavigation The navigation property name.
		 * @param {string} sMetaPath The path in the meta model of the entity.
		 * @returns {string} The navigation label (based on the annotations or property name).
		 * @ignore
		 */
		let fnNavigationLabel = (sNavigation, sMetaPath) => {
			let sAnnotationPath = sMetaPath + "/com.sap.vocabularies.Common.v1.Label",
				oMdlCtxt = oMeta.createBindingContext(sAnnotationPath);
			return (oMdlCtxt && AnnotationHelper.format(oMdlCtxt)) || oMeta.getProperty(sMetaPath + "/name");
		};

		/**
		 * Adds a related entity.
		 * @param {string} sNavigation The navigation name.
		 * @param {string} sLabel The label to be displayed on the link.
		 * @param {Promise} oBarrier The barrier promise (resolved when all related nodes are loaded).
		 * @returns {Promise} A primise which is resolved when the node is added and linked.
		 * @ignore
		 */
		let fnRelated = (sNavigation, sLabel, oBarrier) => {
			let oPromise = this._entity(oModel, oGraph, sPath + "/" + sNavigation, false);
			jQuery.when(oPromise, oBarrier).then(oChild => fnLink(oChild, sLabel));
			return oPromise;
		};

		/**
		 * Handles the (first) expand event of a node.
		 * @param {sap.ui.base.Event} oEvent The UI5 event.
		 * @ignore
		 */
		let fnExpand = (oEvent) => {
			let oMetaCtxt = oMeta.getMetaContext(sPath),
				sMetaPath = oMetaCtxt.getPath(),
				oEntity = oMetaCtxt.getObject(),
				oBarrier = new jQuery.Deferred(),
				oNode = oEvent.getSource(),
				aPromises = jQuery.map((oEntity.navigationProperty || []), (oNav, i) => {
					let oAssoc = oMeta.getODataAssociationEnd(oEntity, oNav.name),
						sLabel = fnNavigationLabel(oNav.name, sMetaPath + "/navigationProperty/" + i),
						oPromise;
					if (!this.fireEvent("addNavigation", { entityPath: sPath, navigationName: oNav.name }, true)) {
						oPromise = jQuery.when();
					} else if (oAssoc.multiplicity.indexOf("*") >= 0) {
						oPromise = this._aggregation(oModel, oGraph, sPath, oNav.name, sLabel);
						jQuery.when(oPromise, oBarrier).then(fnLink);
					} else {
						oPromise = fnRelated(oNav.name, sLabel, oBarrier);
					}
					return oPromise;
				});
			jQuery.when(...aPromises).then(() => oBarrier.resolve());
			oNode.setBusy(true);
			oBarrier.then(() => oNode.setBusy(false));
		};

		/**
		 * Adds the node to the graph and updates the path (makes it absolute).
		 * @param {spet.data.explorer.Node} oNode The node to be added.
		 * @param {sap.ui.model.Context} oContext The context of the node.
		 * @ignore
		 */
		let fnAdd = (oNode, oContext) => {
			sPath = oContext.getPath();
			if (this.fireEvent("addEntity", { entityPath: sPath }, true)) {
				oNode.setKey(sPath);
				oNode.setEntity(sPath);
				oGraph.addNode(oNode);
				oDeferred.resolve(oNode);
			} else {
				oDeferred.resolve();
			}
		};

		/**
		 * Creates the node for the current entity.
		 * @ignore
		 */
		let fnCreate = () => {
			let oNode = new ODataNode({
				origin: bOrigin || false,
				label: fnTitle(),
				expanded: false
			});
			oNode.bindElement(sPath);
			oNode.setModel(oModel);
			oNode.attachEventOnce("expand", fnExpand);
			oNode.attachEvent("detail", oE => {
				this.fireEvent("detailEntity", {dom: oE.getParameter("dom"), entityPath: sPath});
			});

			let oBinding = oNode.getElementBinding();

			let fnCheck = () => {
				var oContext = oBinding.getBoundContext();
				if (oBinding.getBoundContext()) {
					fnAdd(oNode, oContext);
					return true;
				}
				return false;
			};

			if (!fnCheck()) {
				oBinding.attachEventOnce("dataReceived", () => {
					if (!fnCheck()) {
						oDeferred.resolve();
					}
				});
			}
		};

		if (oMeta) {
			oMeta.loaded().then(fnCreate);
		}

		return oDeferred.promise();
	}

	init() {
		var oDeferred = new jQuery.Deferred();
		this._modelPromise = oDeferred.promise();
		this.setAggregation("_graph", new Graph({ directed: true }));
		this.attachModelContextChange(() => {
			let sName = this.getModelName(),
				oComponent = Component.getOwnerComponentFor(this),
				oModel = this.getModel(sName) || (oComponent && oComponent.getModel(sName));
			if (oModel) {
				oDeferred.resolve(oModel);
			}
		});
	}

	setPath(sPath) {
		var oGraph = this.getAggregation("_graph");
		oGraph.removeAllAggregation("nodes");
		oGraph.removeAllAggregation("links");
		this.setProperty("path", sPath);
		this._modelPromise.then(oModel => this._entity(oModel, oGraph, sPath, true));
		return this;
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