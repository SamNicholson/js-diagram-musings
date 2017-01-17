/**
 * The primary workflow diagram handler within Equinox
 */
var WorkFlowDiagram = function(diagramDiv)
{
    this.$ = go.GraphObject.make;
    WorkFlowDiagram.diagram =
        this.$(go.Diagram, diagramDiv,  // must name or refer to the DIV HTML element
          {
              //TODO when not using the evaluation license put this somewhere else!
              //initialContentAlignment: go.Spot.TopLeft,
              initialContentAlignment: go.Spot.Center,
              allowDrop: true,  // must be true to accept drops from the Palette
              "LinkDrawn": showLinkLabel,  // WorkFlowDiagram.diagramEvent listener is defined below
              "LinkRelinked": showLinkLabel,
              "animationManager.duration": 200, // slightly longer than default (600ms) animation
              "undoManager.isEnabled": false  // enable undo & redo
          });

    this.lightText = 'whitesmoke';
    this.defineNodes();
    this.defineModifiedHandler();
    this.linkTemplate();

    // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
    WorkFlowDiagram.diagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
    WorkFlowDiagram.diagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

    load();  // load an initial diagram from some JSON text
    WorkFlowDiagram.diagram.layout =
        this.$(go.LayeredDigraphLayout,
          { angle: 0, layerSpacing: 35});
    var lay = WorkFlowDiagram.diagram.layout;
    lay.alignment = go.TreeLayout.AlignmentStart

    WorkFlowDiagram.diagram.addDiagramListener("ObjectSingleClicked",
                               function(e) {
                                   var part = e.subject.part;
                                   if (!(part instanceof go.Link)) console.log("Clicked on " + part.data.key);
                               });
};

WorkFlowDiagram.$ = go.GraphObject.make;

//This code handles what happens when WorkFlowDiagram.diagram is modified, might be some options here to maybe export the
//diagram or something? Save changes can happen here in the future.
WorkFlowDiagram.prototype.defineModifiedHandler = function()
{
    var thisDiagram = WorkFlowDiagram.diagram;
    WorkFlowDiagram.diagram.addDiagramListener("Modified", function(e) {
        var button = document.getElementById("SaveButton");
        if (button) button.disabled = !thisDiagram.isModified;
        var idx = document.title.indexOf("*");
        if (thisDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.substr(0, idx);
        }
    });
};

WorkFlowDiagram.prototype.defineNodes = function()
{
    WorkFlowDiagram.diagram.nodeTemplateMap.add("",  // the default category
                                  this.$(go.Node, "Spot", nodeStyle(),
                                    // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
                                    this.$(go.Panel, "Auto",
                                      this.$(go.Shape, "RoundedRectangle",
                                        { fill: "#557c9f", stroke: null },
                                        new go.Binding("figure", "figure")),
                                      this.$(go.TextBlock,
                                        {
                                            font: "11pt Open Sans",
                                            stroke: this.lightText,
                                            margin: 8,
                                            minSize: new go.Size(180, NaN),
                                            maxSize: new go.Size(180, NaN),
                                            wrap: go.TextBlock.WrapFit,
                                            editable: true
                                        },
                                        new go.Binding("text").makeTwoWay())
                                    ),
                                    // four named ports, one on each side:
                                    makePort("T", go.Spot.Top, false, true),
                                    makePort("L", go.Spot.Left, true, true),
                                    makePort("R", go.Spot.Right, true, true),
                                    makePort("B", go.Spot.Bottom, true, false)
                                  ));

    WorkFlowDiagram.diagram.nodeTemplateMap.add("Trigger",
                                  this.$(go.Node, "Spot", nodeStyle(),
                                    this.$(go.Panel, "Auto",
                                      this.$(go.Shape, "RoundedRectangle",
                                        { fill: "#5cb15d", stroke: null }),
                                      this.$(go.TextBlock, "Trigger",
                                        {
                                            font: "11pt Open Sans",
                                            stroke: this.lightText,
                                            margin: 8,
                                            minSize: new go.Size(140, NaN),
                                            maxSize: new go.Size(140, NaN),
                                            textAlign: "center"
                                        },
                                        new go.Binding("text"))
                                    ),
                                    // three named ports, one on each side except the top, all output only:
                                    makePort("R", go.Spot.Right, true, false)
                                  ));


    WorkFlowDiagram.diagram.nodeTemplateMap.add("Step",  // the default category
                                    this.$(go.Node, "Spot", nodeStyle(),
                                           // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
                                           this.$(go.Panel, "Auto",
                                                  this.$(go.Shape, "RoundedRectangle",
                                                         { fill: "#557c9f", stroke: null },
                                                         new go.Binding("figure", "figure")),
                                                  this.$(go.TextBlock,
                                                         {
                                                             font: "11pt Open Sans",
                                                             stroke: this.lightText,
                                                             margin: 8,
                                                             minSize: new go.Size(180, NaN),
                                                             maxSize: new go.Size(180, NaN),
                                                             wrap: go.TextBlock.WrapFit,
                                                             editable: true
                                                         },
                                                         new go.Binding("text").makeTwoWay())
                                           ),
                                           // four named ports, one on each side:
                                           makePort("T", go.Spot.Top, false, true),
                                           makePort("L", go.Spot.Left, true, true),
                                           makePort("R", go.Spot.Right, true, true),
                                           makePort("B", go.Spot.Bottom, true, false)
                                    ));

    WorkFlowDiagram.diagram.nodeTemplateMap.add("Component",  // the default category
                                    this.$(go.Node, "Spot", nodeStyle(),
                                           // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
                                           this.$(go.Panel, "Auto",
                                                  this.$(go.Shape, "RoundedRectangle",
                                                         { fill: "#f4f4f4", stroke: null },
                                                         new go.Binding("figure", "figure")),
                                                  this.$(go.TextBlock,
                                                         {
                                                             font: "11pt Open Sans",
                                                             stroke: "#333",
                                                             margin: 8,
                                                             minSize: new go.Size(200, NaN),
                                                             maxSize: new go.Size(200, NaN),
                                                             wrap: go.TextBlock.WrapFit,
                                                             editable: true
                                                         },
                                                         new go.Binding("text").makeTwoWay())
                                           ),
                                           // four named ports, one on each side:
                                           makePort("T", go.Spot.Top, false, true),
                                           makePort("L", go.Spot.Left, true, true),
                                           makePort("R", go.Spot.Right, true, true),
                                           makePort("B", go.Spot.Bottom, true, false)
                                    ));
    WorkFlowDiagram.diagram.nodeTemplateMap.add("task",  // the default category
                                    this.$(go.Node, "Spot", nodeStyle(),
                                           // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
                                           this.$(go.Panel, "Auto",
                                                  this.$(go.Shape, "RoundedRectangle",
                                                         { fill: "#fafafa", stroke: null },
                                                         new go.Binding("figure", "figure")),
                                                  this.$(go.TextBlock,
                                                         {
                                                             font: "11pt Open Sans",
                                                             stroke: "#333",
                                                             margin: 8,
                                                             minSize: new go.Size(400, NaN),
                                                             maxSize: new go.Size(400, NaN),
                                                             wrap: go.TextBlock.WrapFit,
                                                             editable: true
                                                         },
                                                         new go.Binding("text").makeTwoWay())
                                           ),
                                           // four named ports, one on each side:
                                           makePort("T", go.Spot.Top, false, true),
                                           makePort("L", go.Spot.Left, true, true),
                                           makePort("R", go.Spot.Right, true, true),
                                           makePort("B", go.Spot.Bottom, true, false)
                                    ));

};

WorkFlowDiagram.prototype.linkTemplate = function()
{
    WorkFlowDiagram.diagram.linkTemplate =
        this.$(go.Link,  // the whole link panel
          {
              routing: go.Link.AvoidsNodes,
              curve: go.Link.JumpOver,
              corner: 5, toShortLength: 4,
              relinkableFrom: false,
              relinkableTo: false,
              reshapable: false,
              resegmentable: false,
              // mouse-overs subtly highlight links:
              mouseEnter: function(e, link) { link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"; },
              mouseLeave: function(e, link) { link.findObject("HIGHLIGHT").stroke = "transparent"; }
          },
          new go.Binding("points").makeTwoWay(),
          this.$(go.Shape,  // the highlight shape, normally transparent
            { isPanelMain: true, strokeWidth: 8, stroke: "transparent", name: "HIGHLIGHT" }),
          this.$(go.Shape,  // the link path shape
            { isPanelMain: true, stroke: "gray", strokeWidth: 2 }),
          this.$(go.Shape,  // the arrowhead
            { toArrow: "standard", stroke: null, fill: "gray"}),
          this.$(go.Panel, "Auto",  // the link label, normally not visible
            { visible: false, name: "LABEL", segmentIndex: 2, segmentFraction: 0.5},
            new go.Binding("visible", "visible").makeTwoWay(),
            this.$(go.Shape, "RoundedRectangle",  // the label shape
              { fill: "#F8F8F8", stroke: null }),
            this.$(go.TextBlock, "Yes",  // the label
              {
                  textAlign: "center",
                  font: "10pt helvetica, arial, sans-serif",
                  stroke: "#333333",
                  editable: true
              },
              new go.Binding("text").makeTwoWay())
          )
        );

    WorkFlowDiagram.diagram.groupTemplate =
        WorkFlowDiagram.$(go.Group, "Auto",
          { layout: WorkFlowDiagram.$(go.LayeredDigraphLayout,
                      { direction: 0, columnSpacing: 10 }), isSubGraphExpanded: false },
          WorkFlowDiagram.$(go.Shape, "RoundedRectangle", // surrounds everything
            { parameter1: 10, fill: "#f1f1f1", stroke: "#f1f1f1" }),
          WorkFlowDiagram.$(go.Panel, "Vertical",  // position header above the subgraph
            { defaultAlignment: go.Spot.Left },
            WorkFlowDiagram.$(go.Panel, "Horizontal",  // the header
              { defaultAlignment: go.Spot.Top },
              WorkFlowDiagram.$("SubGraphExpanderButton", { margin: 3}),  // this Panel acts as a Button
              WorkFlowDiagram.$(go.TextBlock,     // group title near top, next to button
                { font: "11pt Open Sans", margin: 3 },
                new go.Binding("text", "text"))
            ),
            WorkFlowDiagram.$(go.Placeholder,     // represents area for all member parts
              { padding: new go.Margin(0, 10), background: "#f1f1f1" })
          )
        );
}



function nodeStyle() {
    return [
        // The Node.location comes from the "loc" property of the node data,
        // converted by the Point.parse static method.
        // If the Node.location is changed, it updates the "loc" property of the node data,
        // converting back using the Point.stringify static method.
        new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
        {
            // the Node.location is at the center of each node
            locationSpot: go.Spot.Center,
            //isShadowed: true,
            //shadowColor: "#888",
            // handle mouse enter/leave events to show/hide the ports
            mouseEnter: function (e, obj) { showPorts(obj.part, true); },
            mouseLeave: function (e, obj) { showPorts(obj.part, false); }
        }
    ];
}

// Define a function for creating a "port" that is normally transparent.
// The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
// and where the port is positioned on the node, and the boolean "output" and "input" arguments
// control whether the user can draw links from or to the port.
function makePort(name, spot, output, input) {
    // the port is basically just a small circle that has a white stroke when it is made visible
    return WorkFlowDiagram.$(go.Shape, "Circle",
             {
                 fill: "transparent",
                 stroke: null,  // this is changed to "white" in the showPorts function
                 desiredSize: new go.Size(8, 8),
                 alignment: spot, alignmentFocus: spot,  // align the port on the main Shape
                 portId: name,  // declare this object to be a "port"
                 fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
                 fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
                 cursor: "pointer"  // show a different cursor to indicate potential link point
             });
}

// Make link labels visible if coming out of a "conditional" node.
// This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
function showLinkLabel(e) {
    var label = e.subject.findObject("LABEL");
    if (label !== null) label.visible = (e.subject.fromNode.data.figure === "Diamond");
}

// Make all ports on a node visible when the mouse is over the node
function showPorts(node, show) {
    var diagram = node.diagram;
    if (!diagram || diagram.isReadOnly || !diagram.allowLink) return;
    node.ports.each(function(port) {
        port.stroke = (show ? "white" : null);
    });
}

// Show the diagram's model in JSON format that the user may edit
function save() {
    document.getElementById("mySavedModel").value = WorkFlowDiagram.diagram.model.toJson();
    WorkFlowDiagram.diagram.isModified = false;
}
function load() {
    WorkFlowDiagram.diagram.model = go.Model.fromJSON(
        { "class": "go.GraphLinksModel",
            "linkFromPortIdProperty": "fromPort",
            "linkToPortIdProperty": "toPort",
            "nodeDataArray": [
                {"key":"trigger-1", "category":"Trigger",  "text":"Case Created"},
                {"key":"step-1",  "text":"71(3) Letter From EPO"},

                {"key":"component-1",  "category": "Component", "text":"Run 'Send Letter' Preset"},
                {"key":"component-2",  "category": "Component", "text":"Add Standard Liason Charges"},

                {"key":"trigger-2", "category":"Trigger",  "text":"Incoming Correspondence"},
                {"key":"step-2",  "text":"Client Instructions Received"},
                {"key":"component-3",  "category": "Component", "text":"Run 'Process 71(3)' Preset", "isGroup": true, "isSubGraphExpanded": true},

                {"key":"preset-task-1",  "category": "task", "text":"Send Grant Certification (3 weeks from Filing date)", "group":"component-3"},
                {"key":"preset-task-2",  "category": "task", "text":"Expect Filing Receipt (4 weeks from letter date)", "group":"component-3"},

            ],
            "linkDataArray": [
                {"from":"step-1", "to":"component-1", "fromPort":"R", "toPort":"L"},
                {"from":"step-1", "to":"component-2", "fromPort":"R", "toPort":"L"},
                {"from":"step-2", "to":"component-3", "fromPort":"R", "toPort":"L"},
                {"from":"trigger-1", "to":"step-1", "fromPort":"R", "toPort":"L"},
                {"from":"trigger-2", "to":"step-2", "fromPort":"R", "toPort":"L"},
                {"from":"step-1", "to":"step-2", "fromPort":"R", "toPort":"L"},
                {"from":"preset-task-2", "to":"step-1", "fromPort":"R", "toPort":"L"},
            ]}
    );
}

// add an SVG rendering of the diagram at the end of this page
function makeSVG() {
    var svg = WorkFlowDiagram.diagram.makeSvg({
                                    scale: 0.5
                                });
    svg.style.border = "1px solid black";
    obj = document.getElementById("SVGArea");
    obj.appendChild(svg);
    if (obj.children.length > 0) {
        obj.replaceChild(svg, obj.children[0]);
    }
}
