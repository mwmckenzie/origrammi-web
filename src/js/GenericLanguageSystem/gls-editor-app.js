/**
 * @author Matthew McKenzie
 */


var modes = {
    authoring: "authoring",
    tutorial: "tutorial",
    browsing: "browsing"
};


var app = {
    generateCount: 1,
    mode: undefined,
    grammar: grammar,
    seedLocked: false
};


$(document).ready(function () {
    console.log("start");
    setMode("authoring");
});

function setVisualization(vizMode) {
    console.log("set viz mode: " + vizMode);
    $("#visualization").show();
    app.vizMode = vizMode;
    refreshVisualization();
}

function setMode(mode) {

    let currentMode = mode;
    console.log("Set mode " + currentMode);
    // Set to default view
    $("#nav-col").hide();
    $("#edit-col").show();
    $("#content-col").show();
    app.editMode = "json";
    $("#grammar-mode-select").val("json");
    //$("#grammar-mode-select").val("json");

    switch (mode) {
        case modes.authoring:

            // Various controls for the output
            var outputControls = $("#output .content-header .controls");

            // Origin word select
            var originSelect = $("<select/>", {
                id: "origin-select",
            }).appendTo(outputControls).change(function () {
                app.origin = $(this).val();
                //generate();
            });

            var vizSelect = $("<select/>", {
                id: "visualization-select",
                html: ["expansion", "distribution"].map(function (item) {
                    return "<option>" + item + "</option>";
                }).join("")
            }).appendTo($("#visualization .controls")).change(function () {
                var viz = $(this).val();
                setVisualization(viz);
            });
            

            break;
        case modes.tutorial:
            break;
        case modes.browsing:
            break;
        default:
            break;

    }

}