import jQuery from "jquery.sap.global";
import Control from "sap/ui/core/Control";
import HTML from "sap/ui/core/HTML";
import Device from "sap/ui/Device";
import d3 from "sap/ui/thirdparty/d3";
import Parameters from "sap/ui/core/theming/Parameters";

/**
 * Provides a way of displaying a (directed or undirected) graph.
 * @class
 * @name spet.data.explorer.Graph
 * @extends sap.ui.core.Control
 */
export default class Graph extends Control {
	metadata = {
		properties: {
			/**
			 * The width of the graph.
			 * @type {sap.ui.core.CSSSize}
			 * @default "100%"
			 * @name spet.data.explorer.Graph#width
			 */
			width: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },

			/**
			 * The height of the graph.
			 * @type {sap.ui.core.CSSSize}
			 * @default "100%"
			 * @name spet.data.explorer.Graph#height
			 */
			height: { type: "sap.ui.core.CSSSize", defaultValue: "100%" },

			/**
			 * Flag indicating if the graph edges should be directed.
			 * @type {boolean}
			 * @default true
			 * @name spet.data.explorer.Graph#directed
			 */
			directed: { type: "boolean", defaultValue: true }
		},
		aggregations: {
			/**
			 * Inner HTML control for rendering the underlying SVG.
			 * @private
			 * @type {sap.ui.core.HTML}
			 * @name spet.data.explorer.Graph#_html
			 */
			_html: { type: "sap.ui.core.HTML", multiple: false, visibility: "hidden" },

			/**
			 * Aggregation for hoding the graph's nodes.
			 * @type {spet.data.explorer.Node[]}
			 * @name spet.data.explorer.Graph#nodes
			 */
			nodes: { type: "spet.data.explorer.Node", multiple: true },

			/**
			 * Aggregation for hoding the links between the graph's nodes.
			 * @type {spet.data.explorer.Link[]}
			 * @name spet.data.explorer.Graph#links
			 */
			links: { type: "spet.data.explorer.Link", multiple: true }
		},
		associations: {
			/**
			 * Association for hoding the nodes which should be considered origins (or roots)
			 * of the graph. The origin nodes are used when determining which nodes should be
			 * displayed (only nodes which are reachable through expanded nodes from an origin
			 * are shown).
			 * @type {spet.data.explorer.Node[]}
			 * @name spet.data.explorer.Graph#origins
			 */
			origins: { type: "spet.data.explorer.Node", multiple: true }
		}
	}

	/** The underlying force layout. @private */
	_force = null

	/** The root group of the graph. @private */
	_g = null

	/** The previous size of the screen. @private */
	_size = {}

	init() {
		var oHtml = new HTML({ content: "<svg style=\"height:100%;width:100%\"/>" });
		this.setAggregation("_html", oHtml);
		oHtml.attachAfterRendering(() => {
			this.draw();
			jQuery.sap.delayedCall(200, this, this.checkResize);
		});
		Device.resize.attachHandler(this.checkResize, this);
	}

	/**
	 * Checks the resizing of the screen and redraws if necessary.
	 * @protected
	 * @method spet.data.explorer.Graph#checkResize
	 * @returns {spet.data.explorer.Graph} this to allow method chaining.
	 */
	checkResize() {
		let oSvg = this.getAggregation("_html").getDomRef();
		if (oSvg && (this._size.height !== oSvg.clientHeight || this._size.width !== oSvg.clientWidth)) {
			this.draw();
			jQuery.sap.delayedCall(200, this, this.checkResize);
		}
		return this;
	}

	/**
	 * Initializes the SVG and the force layout.
 	 * @method spet.data.explorer.Graph#initialize
	 * @private
	 * @param {object} oSvg The SVG DOM element (wrapped in a d3 selection).
	 * @returns {void}
	 */
	initialize(oSvg) {
		let oZoom,
			/** Updates the link, node and text positions after a force tick. @ignore */
			fnTick = () => {
				oSvg.select("g.links").selectAll("g.link").selectAll("line")
					.attr("x1", d => d.source.x)
					.attr("y1", d => d.source.y)
					.attr("x2", d => d.target.x)
					.attr("y2", d => d.target.y);

				oSvg.select("g.links").selectAll("g.link").selectAll("text")
					.attr("transform",
					d => "translate(" + (d.source.x + d.target.x) / 2 + "," + (d.source.y + d.target.y) / 2 + ")"
					);

				oSvg.select("g.nodes").selectAll("g.node")
					.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
			};

		this._force = d3.layout.force()
			.linkDistance(d => d.element.getLabel() ? 150 : 100)
			.charge(-200)
			.gravity(0.05)
			.on("tick", fnTick);

		let oG = this._g = oSvg.append("g");
		oG.append("g").attr("class", "links");
		oG.append("g").attr("class", "nodes");

		oSvg.append("svg:defs")
			.append("svg:marker")
			.attr("id", "arrow")
			.attr("refX", 7)
			.attr("refY", 4.5)
			.attr("markerWidth", 8)
			.attr("markerHeight", 8)
			.attr("orient", "auto")
			.append("svg:path")
			.attr("class", "link")
			.style("fill", Parameters.get("sapButton_BorderColor"))
			.attr("d", "M 0 7 L 3.5 4.5 L 0 2");

		oZoom = d3.behavior.zoom();
		oSvg.call(oZoom.on("zoom", () => {
			oG.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
		}));
	}

	/**
	 * Transforms the data by selecting only the nodes which should be visible.
	 * Builds links between these nodes based on the links aggregation.
 	 * @method spet.data.explorer.Graph#data
	 * @private
	 * @returns {object} The resulting nodes and links.
	 */
	data() {
		let mNodes = {},
			mVisited,
			bDirected = this.getDirected(),
			mGraph = {},
			aLinks = this.getLinks() || [],
			aRoots = this.getOrigins() || [],
			aNodes = this.getNodes() || [],
			oResult = { nodes: [], links: [] },

			/**
			 * Performs a BFS-like traversal to find the visible nodes.
			 * @ignore
			 * @param {spet.data.explorer.Node[]} 	aNodes		The graph's nodes.
			 * @param {spet.data.explorer.Node[]} 	aOrigins	The graph's origins.
			 * @param {object}						mGraph		The adjacency matrix.
			 * @returns {object} A map between the node's ID and a flag indicating if
			 * the node was visited by the BFS.
			 */
			fnBfs = (aNodes, aOrigins, mGraph) => {
				var mVisited = {},
					aQueue = aOrigins.slice(0),
					oCurrent,
					sCurrent,
					i;

				for (i = 0; i < aNodes.length; ++i) {
					mVisited[aNodes[i].getId()] = false;
				}

				while (aQueue.length) {
					oCurrent = aQueue.shift();
					sCurrent = oCurrent.getId();
					mVisited[sCurrent] = true;
					if (oCurrent.getExpanded()) {
						for (i = 0; i < mGraph[sCurrent].length; ++i) {
							if (!mVisited[mGraph[sCurrent][i].getId()]) {
								aQueue.push(mGraph[sCurrent][i]);
							}
						}
					}
				}

				return mVisited;
			},

			/**
			 * Initializes the node map, adjacency matrix and root array.
			 * @ignore
			 * @returns {void}
			 */
			fnInitialize = () => {
				for (var i = 0; i < aNodes.length; ++i) {
					mNodes[aNodes[i].getId()] = aNodes[i];
					mGraph[aNodes[i].getId()] = [];
				}
				aRoots = aRoots.map(sRoot => mNodes[sRoot]).filter(oNode => !!oNode);
			},

			/**
			 * Builds the adjacency matrix.
			 * @ignore
			 * @returns {void}
			 */
			fnBuildGraph = () => {
				let i;
				if (bDirected) {
					for (i = 0; i < aLinks.length; ++i) {
						if (mNodes.hasOwnProperty(aLinks[i].getSource()) && mNodes.hasOwnProperty(aLinks[i].getTarget())) {
							mGraph[aLinks[i].getSource()].push(mNodes[aLinks[i].getTarget()]);
						}
					}
				} else {
					for (i = 0; i < aLinks.length; ++i) {
						if (mNodes.hasOwnProperty(aLinks[i].getSource()) && mNodes.hasOwnProperty(aLinks[i].getTarget())) {
							mGraph[aLinks[i].getSource()].push(mNodes[aLinks[i].getTarget()]);
							mGraph[aLinks[i].getTarget()].push(mNodes[aLinks[i].getSource()]);
						}
					}
				}
			},

			/**
			 * Builds the final result based on the "visited" map.
			 * @ignore
			 * @returns {void}
			 */
			fnMakeResult = () => {
				let i;
				for (i = 0; i < aNodes.length; ++i) {
					if (mVisited[aNodes[i].getId()]) {
						oResult.nodes.push(aNodes[i]);
					}
				}
				for (i = 0; i < aLinks.length; ++i) {
					if (mVisited[aLinks[i].getSource()] && mVisited[aLinks[i].getTarget()]) {
						oResult.links.push({
							source: mNodes[aLinks[i].getSource()],
							target: mNodes[aLinks[i].getTarget()],
							element: aLinks[i]
						});
					}
				}
			};

		fnInitialize();
		fnBuildGraph();
		mVisited = fnBfs(aNodes, aRoots, mGraph);
		fnMakeResult();

		return oResult;
	}

	/**
	 * Draws the content on the SVG. This method should only be called manually after
	 * an indirect size change was done (.e.g changing the size of the parent container).
	 * @public
	 * @method spet.data.explorer.Graph#draw
	 * @returns {spet.data.explorer.Graph} this to allow chaining.
	 */
	draw() {
		let oSvg = this.getAggregation("_html").getDomRef();

		if (!oSvg || !oSvg.clientHeight || !oSvg.clientWidth) {
			return this;
		}

		let oLinks,
			oNodes,
			oArc = d3.svg.arc().innerRadius(2).outerRadius(4).startAngle(0).endAngle(Math.PI * 2 / 3);

		/**
		 * Starts the update process by updaing the force layout and selecting the nodes and links.
		 * @ignore
		 * @returns {void}
		 */
		let fnStart = () => {
			let oData = this.data();
			this._size.height = oSvg.clientHeight;
			this._size.width = oSvg.clientWidth;
			oSvg = d3.select(oSvg);

			if (this._g === null) {
				this.initialize(oSvg);
				oSvg.style("background-color", Parameters.get("sapBackgroundColor"));
			}

			this._force.size([this._size.width, this._size.height])
				.nodes(oData.nodes)
				.links(oData.links)
				.start();

			oLinks = oSvg.select("g.links")
				.selectAll("g.link")
				.data(oData.links, d => d.target.getId() + "-" + d.source.getId());

			oNodes = oSvg.select("g.nodes")
				.selectAll("g.node")
				.data(oData.nodes, d => d.getId());
		};

		/**
		 * Updates, inserts and removes links.
		 * @ignore
		 * @returns {void}
		 */
		let fnLinks = () => {
			//update
			oLinks.select("text").text(d => d.element.getLabel());

			//enter
			let oLinkg = oLinks.enter()
				.append("g")
				.attr("class", "link");

			oLinkg.append("line")
				.style("stroke-width", Parameters.get("sapButton_BorderWidth"))
				.style("stroke", Parameters.get("sapButton_BorderColor"));

			oLinkg.append("text")
				.attr("text-anchor", "middle")
				.text(d => d.element.getLabel())
				.style("font", Parameters.get("sapUiFontSmallSize") + " " + Parameters.get("sapUiFontCondensedFamily"))
				.style("color", Parameters.get("sapTextColor"))
				.attr({
					"paint-order": "stroke",
					"stroke": Parameters.get("sapBackgroundColor"),
					"stroke-width": 2,
					"stroke-linecap": "butt",
					"stroke-linejoin": "miter"
				});

			if (this.getDirected()) {
				oLinkg.filter(d => !d.target.getLabelOnly())
					.attr("marker-end", "url(#arrow)");
			}

			//exit
			oLinks.exit().remove();
		};

		/**
		 * Tweens a full-circle rotation.
		 * @ignore
		 * @returns {void}
		 */
		let fnTween = () => {
			let i = d3.interpolate(0, 360);
			return t => "rotate(" + i(t) + ")";
		};

		/**
		 * Performs (recursively) a rotation animation loop.
		 * @ignore
		 * @returns {void}
		 */
		let fnRotate = function() {
			(this.transition ? this : d3.select(this))
				.filter(d => d.getBusy())
				.transition()
				.duration(2000)
				.ease("linear")
				.attrTween("transform", fnTween)
				.each("end", fnRotate);
		};

		/**
		 * Updates, inserts and removes nodes.
		 * @ignore
		 * @returns {void}
		 */
		let fnNodes = () => {
			//update
			oNodes.select("circle")
				.style("fill", d => Parameters.get(d.getExpanded() ? "sapBackgroundColor" : "sapSelectedColor"));

			oNodes.select("text")
				.attr("dy", d => d.getLabelOnly() ? 0 : 7)
				.attr("alignment-baseline", d => d.getLabelOnly() ? "middle" : "hanging")
				.text(d => d.getLabel());

			oNodes.select("title")
				.text(d => d.getTooltip());

			oNodes.filter(d => !d.getBusy())
				.selectAll("path.busy")
				.remove();

			oNodes.filter(function(d) {
					return d.getBusy() && d3.select(this).selectAll("path.busy").empty();
				}).append("path")
				.attr("d", oArc)
				.attr("class", "busy")
				.attr("fill", Parameters.get("sapSelectedColor"))
				.call(fnRotate);

			//enter
			let oNodeg = oNodes.enter().append("g")
				.attr("class", "node")
				.on("mousedown", () => d3.event.stopPropagation())
				.on("click", d => {
					if (!d3.event.defaultPrevented && !d.getLabelOnly() && d.getExpandable() && !d.getBusy()) {
						d.setExpanded(!d.getExpanded());
						d.fireEvent("expand");
					}
				})
				.on("contextmenu", function(d) {
					d.fireEvent("detail", {dom: this});
					d3.event.preventDefault();
				})
				.call(this._force.drag);

			oNodeg.filter(d => !d.getLabelOnly())
				.append("circle")
				.style("fill", d => Parameters.get(d.getExpanded() ? "sapBackgroundColor" : "sapSelectedColor"))
				.style("stroke", Parameters.get("sapButton_BorderColor"))
				.style("stroke-width", Parameters.get("sapButton_BorderWidth"))
				.attr("r", 4.5);

			oNodeg.append("text")
				.attr("dy", d => d.getLabelOnly() ? 0 : 7)
				.attr("alignment-baseline", d => d.getLabelOnly() ? "middle" : "hanging")
				.attr("text-anchor", "middle")
				.text(d => d.getLabel())
				.style("font", Parameters.get("sapUiFontSmallSize") + " " + Parameters.get("sapUiFontCondensedFamily"))
				.style("color", Parameters.get("sapTextColor"))
				.attr({
					"paint-order": "stroke",
					"stroke": Parameters.get("sapBackgroundColor"),
					"stroke-width": 2,
					"stroke-linecap": "butt",
					"stroke-linejoin": "miter"
				});

			oNodeg.append("title")
				.text(d => d.getTooltip());

			oNodeg.filter(d => d.getBusy())
				.append("path")
				.attr("d", oArc)
				.attr("class", "busy")
				.attr("fill", Parameters.get("sapSelectedColor"))
				.call(fnRotate);

			oNodes.exit().remove();
		};

		fnStart();
		fnLinks();
		fnNodes();

		return this;
	}

	/**
	 * The renderer of the control. Wraps the SVG inside a DIV.
	 * @ignore
	 * @param {sap.ui.core.RenderManager} oRM The render manager.
	 * @param {sap.ui.core.Control} oControl The graph.
	 * @returns {void}
	 */
	renderer(oRM, oControl) {
		oRM.write("<div");
		oRM.writeControlData(oControl);
		oRM.addStyle("height", oControl.getHeight());
		oRM.addStyle("width", oControl.getWidth());
		oRM.writeStyles();
		oRM.write(">");
		oRM.renderControl(oControl.getAggregation("_html"));
		oRM.write("</div>");
	}
}