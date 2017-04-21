export default (function() {

    /**
	 * Data visualization (exploration) controls.
	 *
	 * @namespace
	 * @name spet.data.explorer
	 * @author Serban Petrescu
	 * @public
     * @version @@version
	 */
	sap.ui.getCore().initLibrary({
		name : "spet.data.explorer",
		dependencies : ["sap.ui.core"],
        version: "@@version",
		types: [],
		interfaces: [],
		controls: [
            "spet.data.explorer.Graph",
            "spet.data.explorer.KeyNode",
            "spet.data.explorer.MetadataExplorer",
            "spet.data.explorer.Node",
            "spet.data.explorer.ODataExplorer",
            "spet.data.explorer.ODataNode"
        ],
		elements: [
            "spet.data.explorer.KeyLink",
            "spet.data.explorer.Link",
            "spet.data.explorer.ODataLink"
		],
		noLibraryCSS: true
	});

    //eslint-disable-next-line no-undef
    return spet.data.explorer;
})();
