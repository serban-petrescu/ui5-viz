sap.ui.define("spet/data/explorer/library", [], function () {
				"use strict";

				return function () {

								/**
        * Data visualization (exploration) controls.
        *
        * @namespace
        * @name spet.data.explorer
        * @author Serban Petrescu
        * @public
         * @version 0.9.3
        */
								sap.ui.getCore().initLibrary({
												name: "spet.data.explorer",
												dependencies: ["sap.ui.core"],
												version: "0.9.3",
												types: [],
												interfaces: [],
												controls: ["spet.data.explorer.Graph", "spet.data.explorer.KeyNode", "spet.data.explorer.MetadataExplorer", "spet.data.explorer.Node", "spet.data.explorer.ODataExplorer", "spet.data.explorer.ODataNode"],
												elements: ["spet.data.explorer.KeyLink", "spet.data.explorer.Link", "spet.data.explorer.ODataLink"],
												noLibraryCSS: true
								});

								//eslint-disable-next-line no-undef
								return spet.data.explorer;
				}();
});
//# sourceMappingURL=library.js.map
