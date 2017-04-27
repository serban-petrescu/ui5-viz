# UI5 Data Visualization [![Build Status](https://travis-ci.org/serban-petrescu/ui5-viz.svg?branch=master)](https://travis-ci.org/serban-petrescu/ui5-viz) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.svg)](https://gruntjs.com/) [![GitHub Release](https://img.shields.io/github/release/serban-petrescu/ui5-viz.svg)](https://github.com/serban-petrescu/ui5-viz/releases) [![License](https://img.shields.io/github/license/serban-petrescu/ui5-viz.svg)](https://github.com/serban-petrescu/ui5-viz/blob/master/LICENSE)
A set of controls centered around the visualization of data.

## Graph
### Plain
The core control of this library is the `Graph` control. It can represent an (un)directed graph with the help of two aggregations: `Nodes` and `Links`. The `Graph` control is based on the [d3 force-directed graph](https://bl.ocks.org/mbostock/4062045).

Each link has two associated nodes and may have a label. Nodes may be expanded or collapsed by clicking on them. Further details for a node may be displayed with the help of the `details` event (based on the HTML `contextmenu` event: left-click on desktops, long tap on mobiles). Nodes also may be in a busy state, when they display a busy indicator.

[Sample](https://serban-petrescu.github.io/ui5-viz/sample/plain.html).

### Key Based
The plain approach has one major downside: the links between nodes are done via UI5 associations. This means that it is not suitable for data binding. To overcome this, two specialized classes are provided: `KeyNode` and `KeyLink`. Each `KeyNode` must have a unique key (unique inside the graph) and each `KeyLink` stored the keys of two nodes. This representation is more suitable for data binding, because the keys are properties of both the nodes and the links.

[Sample](https://serban-petrescu.github.io/ui5-viz/sample/keys.html).

## OData Metadata Explorer
The `MetadataExplorer` is a specialized control for visualizing the metadata of an OData service. For each OData entity type a node is created and for each OData association a link between the associated entity types is created. The explorer may either display all the nodes at once or it can start with a subset of `root` nodes, allowing the user to expand and collapse the further nodes.

[Sample](https://serban-petrescu.github.io/ui5-viz/sample/meta.html) (left - all nodes; right - root nodes).

## OData Explorer
The `ODataExplorer` is a splecialized control for visualizing the contents of an OData service. It starts from a root entity given as a path in the model. The user may expand each node to obtain the related nodes (linked through a navigation property). For single-cardinality navigation properties, a simple link is created between the nodes. For multiple-cardinality navigation properties, a dedicated node is used to represent the navigation property. Paging is also enabled by creating a dedicated 'More' node (similar mechanism as for the UI5 growing list).

[Sample](https://serban-petrescu.github.io/ui5-viz/sample/odata.html) (the root node may be changed with the context menu).

## Links
- samples (the OData ones are based on the Northwind sample service; it may take a while to load):
  - [plain](https://serban-petrescu.github.io/ui5-viz/sample/plain.html)
  - [keys](https://serban-petrescu.github.io/ui5-viz/sample/keys.html)
  - [meta](https://serban-petrescu.github.io/ui5-viz/sample/meta.html)
  - [odata](https://serban-petrescu.github.io/ui5-viz/sample/odata.html)
- [jsDoc](http://serban-petrescu.github.io/ui5-viz/jsdoc/)
- [latest build](http://serban-petrescu.github.io/ui5-viz/latest.zip)

For a specific version of this library, check the [releases section](https://github.com/serban-petrescu/ui5-viz/releases).

You can also cosume this library through bower: `bower install spet-ui5-viz`.
