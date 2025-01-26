/**
 * A constant representing a line break HTML tag.
 * It is typically used to insert a line break in rendered HTML content.
 *
 * The value of this variable corresponds to the ```<br/>``` HTML element.
 */
const BREAK_TAG = "<br/>";

const BUTTON_TAG = "<button/>";

const BOLD_TAG_START = "<b>";
const BOLD_TAG_END = "</b>";

const SPAN_TAG = "<span/>";

/**
 * A constant representing an HTML <div> tag.
 *
 * This variable holds the string value of a self-closing HTML <div> tag.
 * It can be used to dynamically generate or reference <div> elements in
 * various DOM or string operations.
 *
 * Value: ```<div/>```
 */
const DIV_TAG = "<div/>"
const DIV_TAG_START = "<div>";
const DIV_TAG_END = "</div>";

const SELECT_TAG = "<select/>";

const OPTION_TAG_START = "<option>";
const OPTION_TAG_END = "</option>";

const editModeValues = {
    json: "json",
    visual: "visual",
    step: "step"
}

const visualizationModes = {
    expansion: "expansion",
    distribution: "distribution"
}

/**
 * Represents the configuration object for an application.
 *
 * @property {number} generateCount - The number of generations performed or to be performed by the app.
 * @property {undefined} mode - The mode in which the application is currently running. Default is undefined.
 * @property {Object} grammar - The grammar rules or structure used within the app.
 * @property {boolean} seedLocked - Indicates whether the seed value is locked to ensure consistent results.
 */
const app = {
    generateCount: 1,
    mode: undefined,
    grammar: grammar,
    seedLocked: false
};

$(document).ready(function () {
    console.log("start");
    setMode("authoring");
});


/**
 * Sets the visualization mode for the application and updates the UI accordingly.
 *
 * @param {string} vizMode - The visualization mode to be set. This should correspond to a valid mode recognized by the application.
 * @return {void} This function does not return a value.
 */
function setVisualization(vizMode) {
    console.log("set viz mode: " + vizMode);
    $("#visualization").show();
    app.vizMode = vizMode;
    refreshVisualization();
}

/**
 * Sets up the application grammar by initializing a new grammar object
 * and adding default English language modifiers to it.
 *
 * @return {void} This method does not return any value.
 */
function setUpAppGrammar() {
    app.grammar = tracery.createGrammar();
    app.grammar.addModifiers(baseEngModifiers);
}

/**
 * Sets the default user interface view by hiding and showing specific UI elements.
 * Adjusts the view to edit mode and ensures the grammar mode selector reflects the current edit mode.
 *
 * @return {void} Does not return a value.
 */
function setDefaultUIView() {
    // Set to default view
    $("#nav-col").hide();
    $("#edit-col").show();
    $("#content-col").show();
    $("#grammar-mode-select").val(app.editMode);
}


/**
 * Creates a dropdown menu for selecting an origin and appends it to the specified element.
 *
 * @param {jQuery|HTMLElement} elemToAppendTo - The element to which the dropdown will be appended.
 * @return {jQuery} The created dropdown element.
 */
function createOriginSelectDropdown(elemToAppendTo) {
    return $(SELECT_TAG, {
        id: "origin-select",
    }).appendTo(elemToAppendTo).change(function () {
        app.origin = $(this).val();
        generate();
    });
}


/**
 * Creates a dropdown selection element for visualizations, allowing users to
 * choose between predefined visualization types. The dropdown options include
 * "expansion" and "distribution". When the selection changes, it triggers a
 * corresponding visualization update.
 *
 * @return {jQuery} The jQuery object representing the created dropdown element.
 */
function createVisualizationSelectDropdown() {
    return $(SELECT_TAG, {
        id: "visualization-select",
        html: ["expansion", "distribution"].map(function (item) {
            return OPTION_TAG_START + item + OPTION_TAG_END;
        }).join("")
    }).appendTo($("#visualization .controls")).change(function () {
        var viz = $(this).val();
        setVisualization(viz);
    });
}

/**
 * Creates a dropdown element for selecting a count, appends it to the specified element,
 * and sets up a change event handler to update a global property and trigger a generation function.
 *
 * @param {HTMLElement|jQuery} elemToAppendTo - The DOM element or jQuery object to which the dropdown will be appended.
 * @return {jQuery} The created dropdown element as a jQuery object.
 */
function createGenerateCountSelectDropdown(elemToAppendTo) {
    return $(SELECT_TAG, {
        id: "generate-count",
        html: [1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 60, 100].map(function (num) {
            return OPTION_TAG_START + num + OPTION_TAG_END;
        }).join(""),
    }).appendTo(elemToAppendTo).change(function () {
        app.generateCount = parseInt($(this).val());
        generate();
    });
}

/**
 * Creates and appends a "reroll" button to the specified element.
 * The button, when clicked, generates new content and unlocks the seed lock if it is active.
 *
 * @param {HTMLElement} elemToAppendTo The element to which the reroll button will be appended.
 * @return {jQuery} The jQuery object representing the created reroll button.
 */
function createRerollButton(elemToAppendTo) {
    return $(BUTTON_TAG, {
        text: "reroll"
    }).appendTo(elemToAppendTo).click(function () {
        if (app.seedLocked) {
            toggleSeedLock();
        }
        generate();
    });
}

/**
 * Creates a step button and appends it to the specified element.
 * The button triggers a step-by-step procedure when clicked, altering behavior depending on the application's stepping mode.
 *
 * @param {HTMLElement|jQuery} elemToAppendTo The element to which the step button will be appended.
 * @return {jQuery} The created step button as a jQuery object.
 */
function createStepButton(elemToAppendTo) {
    return $(BUTTON_TAG, {
        text: "step"
    }).appendTo(elemToAppendTo).click(function () {
        
        // generate, but suppress recursion
        generate(true);

        if (app.isStepping) {
            clearInterval(stepTimer);
        } else {
            var stepTimer = setInterval(function () {
                app.stepIterator.node.expand(true);
                var action = app.stepIterator.next();
                if (app.stepIterator.mode === 2 || app.stepIterator.mode === 0) {
                    //  console.log(action.log);
                    app.stepIterator.next();
                }
                if (!action)
                    clearInterval(stepTimer);
                else {
                    //  console.log(action.log);
                }
                refreshVisualization();
                refreshGrammarOutput();
            }, 40);
        }
    });
}


/**
 * Creates and appends generator seed controls to the specified element.
 * Includes a contenteditable div and a lock button for managing seed values.
 *
 * @param {HTMLElement|jQuery} elemToAppendTo The element to which the seed controls will be appended.
 * @return {void} This function does not return a value.
 */
function createGenSeedControls(elemToAppendTo) {

    $(DIV_TAG, {
        id: "gen-seed",
    }).appendTo(elemToAppendTo).attr('contenteditable', 'true').keyup(function () {
        if (!app.seedLocked)
            toggleSeedLock();
        setSeed($(this).text(), false, true);
    });

    $(DIV_TAG, {
        id: "gen-seed-lock",
    }).appendTo(elemToAppendTo).click(function () {
        toggleSeedLock();
    });
}



/**
 * Creates and initializes the grammar title controls for editing grammar titles.
 *
 * The method creates a DOM element representing the grammar title with specific classes and attributes.
 * It appends this element to the header section of the grammar content.
 * The created title element is editable and triggers an event to rename the grammar upon text changes.
 *
 * @return {jQuery} The jQuery-wrapped DOM element for the editable grammar title control.
 */
function createGrammarTitleControls() {
    // Title and renaming
    return $(DIV_TAG, {
        class: "grammar-title",
        text: "My Grammar"
    }).appendTo($("#grammar .content-header .title")).attr('contenteditable', 'true').keyup(function () {
        renameGrammar($(this).text());
    });
}

/**
 * Creates and appends a grammar selection dropdown control to the specified element.
 * The dropdown is populated with grammar names and triggers updates on selection change.
 *
 * @param {Element} elemToAppendTo The DOM element to which the grammar select control will be appended.
 * @return {jQuery} Returns the jQuery object representing the created select control.
 */
function createGrammarSelectControl(elemToAppendTo) {
    return $(SELECT_TAG, {
        id: "grammar-select",
        html: Object.keys(testGrammars).map(function (item) {
            return OPTION_TAG_START + item + OPTION_TAG_END;
        }).join("")
    }).appendTo(elemToAppendTo).change(function () {
        var grammarName = $(this).val();
        loadGrammar(testGrammars[grammarName]);
        generate();
    });
}


/**
 * Creates and appends login controls to the specified DOM element.
 *
 * @param {HTMLElement} elemToAppendTo - The DOM element to which the login controls should be appended.
 * @return {jQuery} A jQuery object representing the created login controls.
 */
function createLoginControls(elemToAppendTo) {
    return $(SPAN_TAG, {
        html: "login",
        class: "login-id"
    }).appendTo(elemToAppendTo);
}

/**
 * Creates and appends a dropdown for selecting the editing mode. The dropdown allows users
 * to select between "json", "visual", and "step" modes, which updates the application's
 * current edit mode and triggers grammar output refresh upon change.
 *
 * @param {HTMLElement|jQuery} elemToAppendTo The DOM element or jQuery object to which the dropdown will be appended.
 * @return {jQuery} The jQuery object representing the created dropdown element.
 */
function createEditModeDropdown(elemToAppendTo) {
    var editMode = $(SELECT_TAG, {
        id: "grammar-mode-select",
        html: [editModeValues.json, editModeValues.visual, editModeValues.step]
            .map(function (item) {
                return OPTION_TAG_START + item + OPTION_TAG_END;
            }).join("")
    }).appendTo(elemToAppendTo).change(function () {
        app.editMode = $(this).val();
        refreshGrammarOutput();
    });
}

/**
 * Creates and appends a visual editing mode toggle to a specified element.
 *
 * @param {Element} elemToAppendTo The DOM element to which the visual editing mode toggle will be appended.
 */
function createVisualEditingModeToggle(elemToAppendTo) {
    // Toggle visual editing mode
    /*
     var grammarMode = $(DIV_TAG, {
     id : "grammar-mode",
     }).appendTo(elemToAppendTo).click(function() {
     toggleGrammarMode();
     });
     */
}

/**
 * Sets the application mode and updates the user interface and controls accordingly.
 *
 * @param {string} mode - The mode to set the application to. Possible values include "authoring", "tutorial", and "browsing".
 * @return {void} This function does not return a value.
 */
function setMode(mode) {

    setUpAppGrammar();

    let currentMode = mode;
    console.log("Set mode " + currentMode);

    app.editMode = editModeValues.json;

    setDefaultUIView();

    // Clear headers

    switch (currentMode) {

        case editModeValues.authoring :

            // Various controls for the output
            var outputControls = $("#output .content-header .controls");

            createOriginSelectDropdown(outputControls);
            createVisualizationSelectDropdown();
            createGenerateCountSelectDropdown(outputControls);
            createRerollButton(outputControls);
            createStepButton(outputControls);
            createGenSeedControls(outputControls);

            // Grammar and info controls
            var grammarControls = $("#grammar .controls");

            createGrammarTitleControls();
            createGrammarSelectControl(grammarControls);
            createLoginControls(grammarControls);
            createEditModeDropdown(grammarControls);
            //createVisualEditingModeToggle(grammarControls);

            break;
        case appModes.tutorial :
            break;
        case appModes.browsing :
            break;
    }

    executeWithDefaults();
}


/**
 * Sets the edit mode for the application.
 *
 * @param {boolean} editMode - A boolean indicating whether to enable or disable edit mode.
 * @return {void} This method does not return any value.
 */
function setEditMode(editMode) {
    app.editMode = setEditMode;
}

/**
 * Executes a sequence of default operations including setting a random seed,
 * selecting a default grammar, loading the selected grammar data,
 * generating content, and setting the default visualization.
 *
 * @return {void} Does not return a value.
 */
function executeWithDefaults() {
    setRandomSeed();
    const elem = $("#grammar-select");
    elem.val("landscape");
    loadGrammar(testGrammars[elem.val()]);
    generate();
    setVisualization(visualizationModes.expansion);
}

//===============================================================
//===============================================================
// Generate

/**
 * Updates the seed value and, optionally, updates the display and regenerates data.
 *
 * @param {number|string} val - The new seed value to set.
 * @param {boolean} updateDisplay - Indicates whether the display should be updated with the new seed value.
 * @param {boolean} regenerate - Specifies whether data regeneration should occur after setting the seed.
 * @return {void}
 */
function setSeed(val, updateDisplay, regenerate) {
    if (regenerate)
        generate();
    if (updateDisplay)
        $("#gen-seed").text(app.genSeed);
    app.genSeed = val;
}

/**
 * Sets a random seed for the random number generator by generating a random integer
 * and passing it to the `setSeed` function. The seed is generated using a random
 * number between 0 and 9999999.
 *
 * @return {void} This function does not return a value.
 */
function setRandomSeed() {
    setSeed(Math.floor(Math.random() * 9999999), true, false);
}

/**
 * Toggles the seed lock state in the application.
 * When toggled, updates the UI to reflect the locked or unlocked state
 * and logs the current seed lock status to the console.
 *
 * @return {void} Does not return a value.
 */
function toggleSeedLock() {
    app.seedLocked = !app.seedLocked;
    if (app.seedLocked)
        $("#gen-seed-lock").addClass("locked");
    else
        $("#gen-seed-lock").removeClass("locked");
    console.log(app.seedLocked);
}

/**
 * Reparses a given raw grammar string and performs validation, error handling,
 * and JSON parsing. Applies the parsed grammar to the application context if valid.
 *
 * @param {string} raw The raw grammar string to be reparsed. Expected to be a JSON-formatted string.
 * @return {void} Returns nothing. Errors found during parsing are handled internally.
 */
function reparseGrammar(raw) {

    const errors = [];

    if (raw === undefined) {
        errors.push({
            index: 0,
            log: "Empty grammar, can't parse yet.",
        });
        handleErrors(errors);
        return;
    }

    // attempt to validate JSON
    console.log("reparsing from raw: " + raw);
    raw = raw.trim();

    if (raw.length === 0) {
        errors.push({
            index: 0,
            log: "Empty grammar, can't parse yet.",
        });
    }

    if (raw.charAt(0) !== "{") {
        errors.push({
            index: 0,
            log: "JSON must start with {, missing {",
        });
    }

    if (raw.charAt(raw.length - 1) !== "}") {
        errors.push({
            index: raw.length - 1,
            log: "JSON must end with }, missing }",
        });
    }

    console.log(errors.length + " errors");

    let json = {};

    try {
        json = JSON.parse(raw);
    } catch (e) {
        console.log(e);
        errors.push({
            log: e
        });
    }

    app.grammar.loadFromRawObj(json);
    rebuildSymbolList();
}

/**
 * Processes and displays error messages on the specified element.
 *
 * @param {Array} errors - An array of error objects where each object contains an `index` and `log` property.
 * @return {void} This function does not return a value.
 */
function handleErrors(errors) {

    const elem = $("#errors");

    if (errors.length < 1) {
        elem.hide();
        return;
    }

    elem.show();
    elem.html("");

    for (var i = 0; i < errors.length; i++) {
        elem.append("<div class='error'>" + errors[i].index + ": " + errors[i].log + DIV_TAG_END);
    }
}



/**
 * Generates the root structure for a grammar based on the app's origin value.
 * If the origin is not provided, a default value of "origin" is used.
 *
 * @return {Object} The generated root object created by app.grammar.
 */
function generateRoot() {
    var origin = app.origin;
    if (!origin) {
        origin = "origin";
    }
    return app.grammar.createRoot("#" + origin + "#");
}

/**
 * Generates output based on the provided parameters and app state.
 * The method initializes seeds, clears grammar states, generates content,
 * and appends it to the output container. It also updates visualization accordingly.
 *
 * @param {boolean} preventRecursion - Determines whether recursion should be prevented
 *                                      during generation of the content.
 * @return {void} - Does not return any value.
 */
function generate(preventRecursion = false) {

    if (!app.seedLocked) {
        setRandomSeed();
    }

    Math.seedrandom(app.genSeed);

    // Clear the grammar
    app.grammar.clearState();

    var outputDiv = $("#output .content");
    clearHtmlElement(outputDiv);
    
    app.generatedRoots = [];
    for (var i = 0; i < app.generateCount; i++) {
        var root = generateRoot();
        root.expand(preventRecursion);
        app.generatedRoots[i] = root;
        //  root.visualizeExpansion($("#output .content"));

        outputDiv.append("<div class='generated-output'>" + root.finishedText + DIV_TAG_END);

        app.stepIterator = new NodeIterator(root);

    }

    refreshVisualization();
}

//===============================================================
//===============================================================
// UI

/**
 * Renames the grammar by updating its title with the given name.
 *
 * @param {string} name - The new name to assign to the grammar.
 * @return {void} This method does not return a value.
 */
function renameGrammar(name) {
    app.grammar.title = name;
    console.log("grammar now named: " + name);
}


/**
 * Toggles the grammar visualization mode in the application.
 * Switches the `app.grammarViz` flag between true and false, updates the UI to reflect the current mode,
 * and refreshes the grammar output display.
 *
 * @return {void} Does not return a value.
 */
function toggleGrammarMode() {
    app.grammarViz = !app.grammarViz;
    console.log("  app.grammarViz" + app.grammarViz);
    if (app.grammarViz)
        $("#grammar-mode").addClass("enabled");
    else
        $("#grammar-mode").removeClass("enabled");
    // Set the view mode to either JSON or graphical
    refreshGrammarOutput();
}


function hideInfo() {
    $("#info .content").hide();
}


function showInfo() {
    $("#info .content").show();
}

/**
 * Loads a grammar object into the application and performs necessary updates.
 *
 * @param {Object} grammar - The grammar object to be loaded.
 * @return {void} Does not return a value.
 */
function loadGrammar(grammar) {
    app.grammar.loadFromRawObj(grammar);
    rebuildSymbolList();
    refreshGrammarOutput();
}


/**
 * Refreshes the visualization of the application based on the current visualization mode.
 * Clears the existing visualization and recreates it according to the selected mode ("distribution" or "expansion").
 * In "distribution" mode, generates virtual roots, performs expansions, and displays the distribution visualization.
 * In "expansion" mode, visualizes the expansion for each generated root with the current active step iterator node.
 *
 * @return {void} Does not return a value, operates directly on the visualization DOM element.
 */
function refreshVisualization() {
    
    const holder = $("#visualization .holder");
    clearHtmlElement(holder);
    
    switch (app.vizMode) {
        case visualizationModes.distribution:
            const virtualGen = 100;
            for (let i = 0; i < virtualGen; i++) {
                const root = generateRoot();
                root.expand();
            }
            app.grammar.distributionVisualization(holder);
            break;
        case visualizationModes.expansion:
            for (let j = 0; j < app.generatedRoots.length; j++) {
                app.generatedRoots[j].visualizeExpansion(holder, {
                    active: app.stepIterator.node
                });
            }

    }
    //   $("#visualization .output-text").html(app.generatedRoots[0].finishedText);
}

/**
 * Clears the inner HTML content of the specified HTML element.
 *
 * @param {jQuery} elem - A jQuery object representing the HTML element to be cleared.
 * @return {void} This function does not return a value.
 */
function clearHtmlElement(elem) {
    elem.html("");
}

function createSymbolContainer(elemToAppendTo) {
    return $(DIV_TAG, {
        class: "vizedit-symbol"
    }).appendTo(elemToAppendTo);
}

function createKeyContainer(elemToAppendTo, key) {
    return $(DIV_TAG, {
        text: key,
        class: "vizedit-key"
    }).appendTo(elemToAppendTo);
}

function createRulesContainer(elemToAppendTo) {
    return $(DIV_TAG, {
        class: "vizedit-rules"
    }).appendTo(elemToAppendTo);
}



function createAddRuleButton(elemToAppendTo) {
    return $(BUTTON_TAG, {
        class: "vizedit-add",
        text: "+"
    }).appendTo(elemToAppendTo);
}


/**
 * Creates and appends a new rule element to the specified rules container.
 * The created rule element is interactive and allows selecting and editing the rule.
 *
 * @param {string} rule - The text content of the rule to be displayed.
 * @param {string} key - The unique identifier associated with the rule.
 * @param {number} ruleIndex - The index of the rule in the rule collection.
 * @param {jQuery|HTMLElement} rulesContainer - The container element where the rule element will be added.
 * @return {jQuery} - The jQuery object representing the created rule element.
 */
function createRuleElement(rule, key, ruleIndex, rulesContainer) {

    const ruleElement = $(DIV_TAG, {
        text: rule,
        class: "vizedit-rule"
    }).appendTo(rulesContainer);

    ruleElement.click(function () {
        app.selectedRule = {key, index: ruleIndex, rule};
        $(".vizedit-rule").removeClass("selected");
        ruleElement.addClass("selected");

        ruleElement.attr("contenteditable", "true").keyup(function () {
            generate(); // Trigger generation
        });
    });

    return ruleElement;
}


/**
 * Adds a stack of rule sets to the specified container. Each rule set is rendered as a visual group,
 * and the last rule set in the stack is marked as active.
 *
 * @param {HTMLElement|jQuery} rulesContainer The container where the rule sets will be appended.
 * @param {Array<Object>} stack An array of rule set objects. Each rule set should have a `defaultRules` property containing an array of rules.
 * @return {void} Does not return anything.
 */
function addRuleStack(rulesContainer, stack) {
    stack.forEach((ruleset, index) => {
        const rulesetContainer = $(DIV_TAG, {
            class: "vizedit-ruleset"
        }).appendTo(rulesContainer);

        if (index === stack.length - 1) {
            rulesetContainer.addClass("active");
        }

        ruleset.defaultRules.forEach(rule => {
            $(DIV_TAG, {
                text: rule,
                class: "vizedit-rule"
            }).appendTo(rulesetContainer);
        });
    });
}


/**
 * Generates an array of formatted grammar lines based on the provided keys and grammar object.
 *
 * @param {string[]} keys - An array of keys to access values in the grammar object.
 * @param {Object} grammar - An object containing key-value pairs where values can be strings or arrays of strings.
 * @return {string[]} An array of formatted strings representing the grammar lines for the given keys.
 */
function generateGrammarLines(keys, grammar) {
    
    const formatGrammarValue = (value) =>
        Array.isArray(value)
            ? value.map(item => `"${item}"`).join(", ")
            : `"${value}"`;

    return keys.map(key => {
        const formattedValue = formatGrammarValue(grammar[key]);
        return `"${BOLD_TAG_START}${key}${BOLD_TAG_END}": [${formattedValue}]`;
    });
}


/**
 * Refreshes the grammar output display based on the application's current edit mode.
 * This function updates the DOM to reflect changes in grammar rules, either in the visual editing mode,
 * stepped editing mode, or a raw JSON view.
 *
 * @return {void} This method does not return a value; it updates the grammar output in the DOM.
 */
function refreshGrammarOutput() {

    const holder = $("#grammar-holder");
    clearHtmlElement(holder);

    const rawGrammar = app.grammar.raw;
    const rawKeys = Object.keys(rawGrammar);

    switch (app.editMode) {

        case editModeValues.visual:

            rawKeys.forEach((key) => {

                const symbolContainer = createSymbolContainer(holder);
                createKeyContainer(symbolContainer, key);
                const rulesContainer = createRulesContainer(symbolContainer);
                createAddRuleButton(symbolContainer);

                const rawGrammarRules = rawGrammar[key];

                if (!Array.isArray(rawGrammarRules)) return;

                rawGrammarRules.forEach((rule, ruleIndex) => {
                    createRuleElement(rule, key, ruleIndex, rulesContainer);
                });
            })
            break;

        case editModeValues.step:

            const symbolKeys = Object.keys(app.grammar.symbols);

            symbolKeys.forEach((key) => {
                const symbol = app.grammar.symbols[key];
                const symbolContainer = createSymbolContainer(holder);
                const keyContainer = createKeyContainer(symbolContainer, key);

                if (symbol.isDynamic) {
                    keyContainer.addClass("dynamic");
                }

                const rulesContainer = createRulesContainer(symbolContainer);

                addRuleStack(rulesContainer, symbol.stack);
            })
            break;

        default:

            const grammarHolder = $(DIV_TAG_START, {
                class: "grammar-json",
            }).appendTo(holder);

            const lines = generateGrammarLines(rawKeys, rawGrammar);

            //return `"${BOLD_TAG_START}${key}${BOLD_TAG_END}": [${formattedValue}]`;
            
            const text = `{${BREAK_TAG}${lines.join("," + BREAK_TAG)}${BREAK_TAG}}`;
            grammarHolder.append(text);
            
            //grammarHolder.append("{" + BREAK_TAG + lines.join("," + BREAK_TAG) + BREAK_TAG + "}");

            grammarHolder.attr('contenteditable', 'true').keyup(function () {
                reparseGrammar($(this).text());
                generate();
            });
            break;
    }

}
