function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * Control for exploring the content of an OData model.
 * This explorer starts from a single entity root node.
 * Each node can either be an entity or a multi-cardinality
 * navigation.
 * @class
 * @name spet.data.explorer.ODataExplorer
 */
sap.ui.define("spet/data/explorer/ODataExplorer", ["jquery.sap.global", "sap/ui/core/Control", "sap/ui/core/Component", "sap/ui/model/odata/AnnotationHelper", "spet/data/explorer/Graph", "spet/data/explorer/ODataNode", "spet/data/explorer/ODataLink"], function (jQuery, Control, Component, AnnotationHelper, Graph, ODataNode, ODataLink) {
	"use strict";

	return Control.extend("spet.data.explorer.ODataExplorer", {
		metadata: {
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
     * @property {spet.data.explorer.Node} node The new node.
     */
				addEntity: {
					entityPath: { type: "string" },
					node: { type: "spet.data.explorer.Node" }
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

			/**
    * Promise which is resolved when the model is available.
    * @private
    * @name spet.data.explorer.ODataExplorer#_modelPromise
    */
		},
		_modelPromise: null,
		_link: function _link(oGraph, sSource, sTarget, sLabel) {
			var oLink = new ODataLink({
				sourceKey: sSource,
				targetKey: sTarget,
				label: sLabel || ""
			});
			oGraph.addLink(oLink);
			return oLink;
		},
		_aggregation: function _aggregation(oModel, oGraph, sPath, sNavigation, sLabel) {
			var _this = this;

			var sFull = sPath + "/" + sNavigation,
			    oBinding = oModel.bindList(sFull).initialize(),
			    iIndex = 0,
			    iCount = this.getGrowingThreshold(),
			    oDeferred = new jQuery.Deferred(),
			    oMoreNode = void 0,
			    oMoreLink = void 0;

			var fnLink = function fnLink(oChild) {
				return oChild && _this._link(oGraph, sFull, oChild.getKey());
			};

			/**
    * Creates the navigation node.
    * @ignore
    */
			var fnNode = function fnNode() {
				var oNode = new ODataNode({
					key: sFull,
					expanded: true,
					label: sLabel,
					entity: sPath
				});
				oNode.attachEvent("detail", function (oE) {
					_this.fireEvent("detailNavigation", {
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
			var fnChildren = function fnChildren(aContexts) {
				jQuery.each(aContexts, function (ii, oC) {
					return _this._entity(oModel, oGraph, oC.getPath(), false).then(fnLink);
				});
			};

			/**
    * Handles the functionality of loading more children (similar to the growing list).
    * @param {int} iLength The complete length of the OData collection.
    * @ignore
    */
			var fnMore = function fnMore(iLength) {
				if (oMoreNode) {
					oMoreNode.setBusy(false);
					oGraph.removeNode(oMoreNode);
					oGraph.removeLink(oMoreLink);
				}
				iIndex += iCount;
				if (iIndex < iLength) {
					var sMoreKey = sFull + "/__more";
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
			var fnData = function fnData() {
				var iLength = oBinding.getLength();
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
			var fnRequest = function fnRequest() {
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
		},
		_entity: function _entity(oModel, oGraph, sPath, bOrigin) {
			var _this2 = this;

			var oMeta = oModel && oModel.getMetaModel(),
			    oDeferred = new jQuery.Deferred();

			/**
    * Gets the title of a node (based on annotations or entity type name).
    * @returns {string} The title of the node.
    * @ignore
    */
			var fnTitle = function fnTitle() {
				var oMetaCtxt = oMeta.getMetaContext(sPath),
				    sAnnotationPath = oMetaCtxt.getPath() + "/com.sap.vocabularies.UI.v1.HeaderInfo/Title",
				    oMdlCtxt = oMeta.createBindingContext(sAnnotationPath);
				return oMdlCtxt && AnnotationHelper.format(oMdlCtxt) || oMetaCtxt.getProperty("name");
			};

			/**
    * Creates a link between the current entity and a child node.
    * @param {spet.data.explorer.Node} oChild The child node.
    * @param {string=} sLabel Optional label for the created link.
    * @returns {spet.data.explorer.Link|null} The created link.
    * @ignore
    */
			var fnLink = function fnLink(oChild, sLabel) {
				return oChild && _this2._link(oGraph, sPath, oChild.getKey(), sLabel);
			};

			/**
    * Retrieves the label for a navigation.
    * @param {string} sNavigation The navigation property name.
    * @param {string} sMetaPath The path in the meta model of the entity.
    * @returns {string} The navigation label (based on the annotations or property name).
    * @ignore
    */
			var fnNavigationLabel = function fnNavigationLabel(sNavigation, sMetaPath) {
				var sAnnotationPath = sMetaPath + "/com.sap.vocabularies.Common.v1.Label",
				    oMdlCtxt = oMeta.createBindingContext(sAnnotationPath);
				return oMdlCtxt && AnnotationHelper.format(oMdlCtxt) || oMeta.getProperty(sMetaPath + "/name");
			};

			/**
    * Adds a related entity.
    * @param {string} sNavigation The navigation name.
    * @param {string} sLabel The label to be displayed on the link.
    * @param {Promise} oBarrier The barrier promise (resolved when all related nodes are loaded).
    * @returns {Promise} A primise which is resolved when the node is added and linked.
    * @ignore
    */
			var fnRelated = function fnRelated(sNavigation, sLabel, oBarrier) {
				var oPromise = _this2._entity(oModel, oGraph, sPath + "/" + sNavigation, false);
				jQuery.when(oPromise, oBarrier).then(function (oChild) {
					return fnLink(oChild, sLabel);
				});
				return oPromise;
			};

			/**
    * Handles the (first) expand event of a node.
    * @param {sap.ui.base.Event} oEvent The UI5 event.
    * @ignore
    */
			var fnExpand = function fnExpand(oEvent) {
				var oMetaCtxt = oMeta.getMetaContext(sPath),
				    sMetaPath = oMetaCtxt.getPath(),
				    oEntity = oMetaCtxt.getObject(),
				    oBarrier = new jQuery.Deferred(),
				    oNode = oEvent.getSource(),
				    aPromises = jQuery.map(oEntity.navigationProperty || [], function (oNav, i) {
					var oAssoc = oMeta.getODataAssociationEnd(oEntity, oNav.name),
					    sLabel = fnNavigationLabel(oNav.name, sMetaPath + "/navigationProperty/" + i),
					    oPromise = void 0;
					if (!_this2.fireEvent("addNavigation", { entityPath: sPath, navigationName: oNav.name }, true)) {
						oPromise = jQuery.when();
					} else if (oAssoc.multiplicity.indexOf("*") >= 0) {
						oPromise = _this2._aggregation(oModel, oGraph, sPath, oNav.name, sLabel);
						jQuery.when(oPromise, oBarrier).then(fnLink);
					} else {
						oPromise = fnRelated(oNav.name, sLabel, oBarrier);
					}
					return oPromise;
				});
				jQuery.when.apply(jQuery, _toConsumableArray(aPromises)).then(function () {
					return oBarrier.resolve();
				});
				oNode.setBusy(true);
				oBarrier.then(function () {
					return oNode.setBusy(false);
				});
			};

			/**
    * Adds the node to the graph and updates the path (makes it absolute).
    * @param {spet.data.explorer.Node} oNode The node to be added.
    * @param {sap.ui.model.Context} oContext The context of the node.
    * @ignore
    */
			var fnAdd = function fnAdd(oNode, oContext) {
				sPath = oContext.getPath();
				oNode.setKey(sPath);
				oNode.setEntity(sPath);
				if (_this2.fireEvent("addEntity", { entityPath: sPath, node: oNode }, true)) {
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
			var fnCreate = function fnCreate() {
				var oNode = new ODataNode({
					origin: bOrigin || false,
					label: fnTitle(),
					expanded: false
				});
				oNode.bindElement(sPath);
				oNode.setModel(oModel);
				oNode.attachEventOnce("expand", fnExpand);
				oNode.attachEvent("detail", function (oE) {
					_this2.fireEvent("detailEntity", { dom: oE.getParameter("dom"), entityPath: sPath });
				});

				var oBinding = oNode.getElementBinding();

				var fnCheck = function fnCheck() {
					var oContext = oBinding.getBoundContext();
					if (oBinding.getBoundContext()) {
						fnAdd(oNode, oContext);
						return true;
					}
					return false;
				};

				if (!fnCheck()) {
					oBinding.attachEventOnce("dataReceived", function () {
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
		},
		init: function init() {
			var _this3 = this;

			var oDeferred = new jQuery.Deferred();
			this._modelPromise = oDeferred.promise();
			this.setAggregation("_graph", new Graph({ directed: true }));
			this.attachModelContextChange(function () {
				var sName = _this3.getModelName(),
				    oComponent = Component.getOwnerComponentFor(_this3),
				    oModel = _this3.getModel(sName) || oComponent && oComponent.getModel(sName);
				if (oModel) {
					oDeferred.resolve(oModel);
				}
			});
		},
		setPath: function setPath(sPath) {
			var _this4 = this;

			var oGraph = this.getAggregation("_graph");
			oGraph.removeAllAggregation("nodes");
			oGraph.removeAllAggregation("links");
			this.setProperty("path", sPath);
			this._modelPromise.then(function (oModel) {
				return _this4._entity(oModel, oGraph, sPath, true);
			});
			return this;
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
//# sourceMappingURL=ODataExplorer.js.map
