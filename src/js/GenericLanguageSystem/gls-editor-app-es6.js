/**
 * Modern ES6 version using classes and BEM-style naming.
 * Some helper functions (e.g. generateRoot, renameGrammar, etc.) are implemented as placeholders.
 */

const BREAK_TAG = "<br/>";
const BUTTON_TAG = "<button/>";
const BOLD_TAG_START = "<b>";
const BOLD_TAG_END = "</b>";
const SPAN_TAG = "<span/>";
const DIV_TAG = "<div/>";
const DIV_TAG_START = "<div>";
const DIV_TAG_END = "</div>";
const SELECT_TAG = "<select/>";
const OPTION_TAG_START = "<option>";
const OPTION_TAG_END = "</option>";

const appModes = {
    undefined: undefined,
    authoring: "authoring",
    tutorial: "tutorial",
    browsing: "browsing"
};

const editModes = {
    json: "json",
    visual: "visual",
    step: "step"
};

const visualizationModes = {
    expansion: "expansion",
    distribution: "distribution"
};

class App {
    constructor() {
        // In a complete app, grammar would be imported or defined elsewhere.
        this.grammar = window.grammar || {};
        this.generateCount = 1;
        this.mode = appModes.undefined;
        this.seedLocked = false;
        this.vizMode = visualizationModes.expansion;
        this.editMode = editModes.json;
        this.genSeed = null;
        this.generatedRoots = [];
        this.stepIterator = { node: null, next: () => null, mode: 0 };
        this.isStepping = false;
    }

    // Utility: Wrap a string in an HTML option tag.
    wrapInOptionTag(text) {
        return OPTION_TAG_START + text + OPTION_TAG_END;
    }

    // Initialization function (runs on document ready)
    init() {
        $(document).ready(() => {
            console.log("App Starting...");
            this.setMode(appModes.authoring);
        });
    }

    // ---------------- Visualization Methods ----------------

    setVisualization(vizMode) {
        console.log(`Setting viz mode: ${vizMode}`);
        $("#visualization").show();
        this.vizMode = vizMode;
        this.refreshVisualization();
    }

    refreshVisualization() {
        const holder = $("#visualization .visualization__holder");
        this.clearHtmlElement(holder);

        switch (this.vizMode) {
            case visualizationModes.distribution: {
                const virtualGen = 100;
                for (let i = 0; i < virtualGen; i++) {
                    const root = this.generateRoot();
                    root.expand();
                }
                // The distribution visualization is provided by the grammar object.
                if (this.grammar.distributionVisualization) {
                    this.grammar.distributionVisualization(holder);
                }
                break;
            }
            case visualizationModes.expansion:
                if (!this.generatedRoots) return;
                this.generatedRoots.forEach(root => {
                    root.visualizeExpansion(holder, { active: this.stepIterator.node });
                });
                break;
            default:
                break;
        }
    }

    // ---------------- UI Setup Methods ----------------

    setDefaultUIView() {
        $("#nav-col").hide();
        $("#edit-col").show();
        $("#content-col").show();
        $("#grammar-mode-select").val(this.editMode);
    }

    createOriginSelectDropdown(elemToAppendTo) {
        return $(SELECT_TAG, {
            id: "origin-select",
            class: "app__select app__select--origin"
        })
            .appendTo(elemToAppendTo)
            .change(() => {
                this.origin = $(event.target).val();
                this.generate();
            });
    }

    createVisualizationSelectDropdown() {
        return $(SELECT_TAG, {
            id: "visualization-select",
            class: "visualization__select",
            html: Object.keys(visualizationModes)
                .map(mode => this.wrapInOptionTag(mode))
                .join("")
        })
            .appendTo($("#visualization .visualization__controls"))
            .change(() => {
                const viz = $(event.target).val();
                this.setVisualization(viz);
            });
    }

    createGenerateCountSelectDropdown(elemToAppendTo) {
        return $(SELECT_TAG, {
            id: "generate-count",
            class: "app__select app__select--generate-count",
            html: [1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 60, 100]
                .map(num => this.wrapInOptionTag(num))
                .join("")
        })
            .appendTo(elemToAppendTo)
            .change(() => {
                this.generateCount = parseInt($(event.target).val());
                this.generate();
            });
    }

    createRerollButton(elemToAppendTo) {
        return $(BUTTON_TAG, {
            text: "reroll",
            class: "app__button app__button--reroll"
        })
            .appendTo(elemToAppendTo)
            .click(() => {
                if (this.seedLocked) {
                    this.toggleSeedLock();
                }
                this.generate();
            });
    }

    createStepButton(elemToAppendTo) {
        return $(BUTTON_TAG, {
            text: "step",
            class: "app__button app__button--step"
        })
            .appendTo(elemToAppendTo)
            .click(() => {
                // Generate without recursion
                this.generate(true);
                if (this.isStepping) {
                    clearInterval(this.stepTimer);
                } else {
                    this.stepTimer = setInterval(() => {
                        this.stepIterator.node.expand(true);
                        const action = this.stepIterator.next();
                        if (this.stepIterator.mode === 2 || this.stepIterator.mode === 0) {
                            this.stepIterator.next();
                        }
                        if (!action) clearInterval(this.stepTimer);
                        this.refreshVisualization();
                        this.refreshGrammarOutput();
                    }, 40);
                }
            });
    }

    createGenSeedControls(elemToAppendTo) {
        $(DIV_TAG, {
            id: "gen-seed",
            class: "app__seed app__seed--editable"
        })
            .appendTo(elemToAppendTo)
            .attr("contenteditable", "true")
            .keyup(() => {
                if (!this.seedLocked) this.toggleSeedLock();
                this.setSeed($(event.target).text(), false, true);
            });

        $(DIV_TAG, {
            id: "gen-seed-lock",
            class: "app__seed-lock"
        })
            .appendTo(elemToAppendTo)
            .click(() => {
                this.toggleSeedLock();
            });
    }

    createGrammarTitleControls() {
        return $(DIV_TAG, {
            class: "grammar__title",
            text: "My Grammar"
        })
            .appendTo($("#grammar .grammar__content-header .grammar__title-container"))
            .attr("contenteditable", "true")
            .keyup(() => {
                this.renameGrammar($(event.target).text());
            });
    }

    createGrammarSelectControl(elemToAppendTo) {
        return $(SELECT_TAG, {
            id: "grammar-select",
            class: "grammar__select",
            html:
                typeof testGrammars !== "undefined"
                    ? Object.keys(testGrammars)
                        .map(item => this.wrapInOptionTag(item))
                        .join("")
                    : ""
        })
            .appendTo(elemToAppendTo)
            .change(() => {
                const grammarName = $(event.target).val();
                this.loadGrammar(typeof testGrammars !== "undefined" ? testGrammars[grammarName] : null);
                this.generate();
            });
    }

    createLoginControls(elemToAppendTo) {
        return $(SPAN_TAG, {
            text: "login",
            class: "login__id"
        }).appendTo(elemToAppendTo);
    }

    createEditModeDropdown(elemToAppendTo) {
        return $(SELECT_TAG, {
            id: "grammar-mode-select",
            class: "grammar__select grammar__select--mode",
            html: [editModes.json, editModes.visual, editModes.step]
                .map(mode => this.wrapInOptionTag(mode))
                .join("")
        })
            .appendTo(elemToAppendTo)
            .change(() => {
                this.editMode = $(event.target).val();
                this.refreshGrammarOutput();
            });
    }

    // ---------------- Grammar Output & Error Handling ----------------

    refreshGrammarOutput() {
        const holder = $("#grammar-holder");
        this.clearHtmlElement(holder);

        const rawGrammar = this.grammar.raw;
        const rawKeys = rawGrammar ? Object.keys(rawGrammar) : [];

        switch (this.editMode) {
            case editModes.visual:
                rawKeys.forEach(key => {
                    const symbolContainer = this.createSymbolContainer(holder);
                    this.createKeyContainer(symbolContainer, key);
                    const rulesContainer = this.createRulesContainer(symbolContainer);
                    this.createAddRuleButton(symbolContainer);
                    const rawGrammarRules = rawGrammar[key];
                    if (!Array.isArray(rawGrammarRules)) return;
                    rawGrammarRules.forEach((rule, ruleIndex) => {
                        this.createRuleElement(rule, key, ruleIndex, rulesContainer);
                    });
                });
                break;
            case editModes.step: {
                const symbolKeys = Object.keys(this.grammar.symbols || {});
                symbolKeys.forEach(key => {
                    const symbol = this.grammar.symbols[key];
                    const symbolContainer = this.createSymbolContainer(holder);
                    const keyContainer = this.createKeyContainer(symbolContainer, key);
                    if (symbol.isDynamic) {
                        keyContainer.addClass("grammar__key--dynamic");
                    }
                    const rulesContainer = this.createRulesContainer(symbolContainer);
                    this.addRuleStack(rulesContainer, symbol.stack);
                });
                break;
            }
            default: {
                const grammarHolder = $(DIV_TAG_START, { class: "grammar__json" }).appendTo(holder);
                const lines = this.generateGrammarLines(rawKeys, rawGrammar);
                const text = `{${BREAK_TAG}${lines.join(`,${BREAK_TAG}`)}${BREAK_TAG}}`;
                grammarHolder.append(text);
                grammarHolder.attr("contenteditable", "true").keyup(() => {
                    this.reparseGrammar($(event.target).text());
                });
                break;
            }
        }
    }

    reparseGrammar(raw) {
        const errors = [];
        if (raw === undefined) {
            errors.push({ index: 0, log: "Empty grammar, can't parse yet." });
            this.handleErrors(errors);
            return;
        }

        console.log("Reparsing from raw:", raw);
        raw = raw.trim();
        if (raw.length === 0) {
            errors.push({ index: 0, log: "Empty grammar, can't parse yet." });
        }
        if (raw.charAt(0) !== "{") {
            errors.push({ index: 0, log: "JSON must start with {, missing {" });
        }
        if (raw.charAt(raw.length - 1) !== "}") {
            errors.push({ index: raw.length - 1, log: "JSON must end with }, missing }" });
        }

        console.log(`${errors.length} errors`);
        let json = {};
        try {
            json = JSON.parse(raw);
        } catch (e) {
            console.log(e);
            errors.push({ log: e.toString() });
        }

        // Update grammar based on parsed JSON here…
        this.rebuildSymbolList();
    }

    handleErrors(errors) {
        const elem = $("#errors");
        if (errors.length < 1) {
            elem.hide();
            return;
        }
        elem.show().html("");
        errors.forEach(error => {
            elem.append(`<div class="error">${error.index}: ${error.log}${DIV_TAG_END}`);
        });
    }

    rebuildSymbolList() {
        if (!this.grammar || !this.grammar.symbols) return;
        const originOptions = Object.keys(this.grammar.symbols)
            .map(key => this.wrapInOptionTag(key))
            .join("");
        $("#origin-select").html(this.wrapInOptionTag("origin") + originOptions);
    }

    generateGrammarLines(keys, grammar) {
        const formatGrammarValue = value =>
            Array.isArray(value)
                ? value.map(item => `"${item}"`).join(", ")
                : `"${value}"`;

        return keys.map(key => {
            const formattedValue = formatGrammarValue(grammar[key]);
            return `"${BOLD_TAG_START}${key}${BOLD_TAG_END}": [${formattedValue}]`;
        });
    }

    // ---------------- Mode & Seed Methods ----------------

    setMode(mode) {
        console.log(`Setting Application mode ${mode}`);
        this.editMode = editModes.json;
        this.setDefaultUIView();

        switch (mode) {
            case appModes.authoring: {
                const outputControls = $("#output .output__controls");
                this.createOriginSelectDropdown(outputControls);
                this.createVisualizationSelectDropdown();
                this.createGenerateCountSelectDropdown(outputControls);
                this.createRerollButton(outputControls);
                this.createStepButton(outputControls);
                this.createGenSeedControls(outputControls);

                const grammarControls = $("#grammar .grammar__controls");
                this.createGrammarTitleControls();
                // Uncomment the next line if you want a grammar selection dropdown
                // this.createGrammarSelectControl(grammarControls);
                this.createLoginControls(grammarControls);
                this.createEditModeDropdown(grammarControls);
                // Optionally add a visual editing toggle:
                // this.createVisualEditingModeToggle(grammarControls);
                break;
            }
            case appModes.tutorial:
                // Implement tutorial mode UI setup if needed.
                break;
            case appModes.browsing:
                // Implement browsing mode UI setup if needed.
                break;
            default:
                break;
        }
        this.executeWithDefaults();
    }

    setEditMode(editMode) {
        this.editMode = editMode;
    }

    executeWithDefaults() {
        this.setRandomSeed();
        const elem = $("#grammar-select");
        elem.val("landscape");
        // Optionally load a default grammar:
        // this.loadGrammar(testGrammars[elem.val()]);
        // this.generate();
        this.setVisualization(visualizationModes.expansion);
    }

    setSeed(val, updateDisplay, regenerate) {
        if (regenerate) this.generate();
        if (updateDisplay) $("#gen-seed").text(this.genSeed);
        this.genSeed = val;
    }

    setRandomSeed() {
        this.setSeed(Math.floor(Math.random() * 9999999), true, false);
    }

    toggleSeedLock() {
        this.seedLocked = !this.seedLocked;
        if (this.seedLocked) {
            $("#gen-seed-lock").addClass("app__seed-lock--locked");
        } else {
            $("#gen-seed-lock").removeClass("app__seed-lock--locked");
        }
        console.log("Seed locked:", this.seedLocked);
    }

    clearHtmlElement(elem) {
        elem.html("");
    }

    // ---------------- Placeholder Methods ----------------

    generate(skipRecursion) {
        console.log("Generate method called", skipRecursion ? "(skip recursion)" : "");
        // Add your generation logic here.
    }

    generateRoot() {
        // Return a dummy root with an expand method.
        return {
            expand: (flag) => console.log("Root expanded", flag ? "with flag" : "")
        };
    }

    renameGrammar(text) {
        console.log("Renaming grammar to:", text);
        // Implement renaming logic here.
    }

    createSymbolContainer(holder) {
        return $("<div>", {
            class: "grammar__symbol-container"
        }).appendTo(holder);
    }

    createKeyContainer(symbolContainer, key) {
        return $("<div>", {
            class: "grammar__key-container",
            text: key
        }).appendTo(symbolContainer);
    }

    createRulesContainer(symbolContainer) {
        return $("<div>", {
            class: "grammar__rules-container"
        }).appendTo(symbolContainer);
    }

    createAddRuleButton(symbolContainer) {
        return $("<button>", {
            class: "grammar__button grammar__button--add-rule",
            text: "Add Rule"
        })
            .appendTo(symbolContainer)
            .click(() => {
                console.log("Add rule clicked");
                // Implement rule addition here.
            });
    }

    createRuleElement(rule, key, ruleIndex, rulesContainer) {
        return $("<div>", {
            class: "grammar__rule",
            text: rule
        }).appendTo(rulesContainer);
    }

    addRuleStack(rulesContainer, stack) {
        stack.forEach(rule => {
            $("<div>", {
                class: "grammar__rule-stack-item",
                text: rule
            }).appendTo(rulesContainer);
        });
    }
}

// Initialize the application.
const myApp = new App();
myApp.init();

