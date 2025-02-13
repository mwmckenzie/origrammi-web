/**
 * app.js
 *
 * This file demonstrates a modular, modern ES6 approach to the original code.
 * It separates concerns into several classes:
 *   - App: the main controller and state holder.
 *   - UIController: creates UI elements and attaches event handlers.
 *   - GrammarManager: handles grammar parsing, error handling, and output.
 *   - VisualizationManager: manages visualization mode and updates.
 *
 * This version replaces jQuery with vanilla JavaScript.
 */

/* Utility: A debounce helper to limit the rate of function calls. */
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

/* Utility: Create an element with given options.
 * Options may include: id, class, text, html, contenteditable (as a string "true"/"false").
 */
function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.id) el.id = options.id;
    if (options.class) el.className = options.class;
    if (options.text) el.textContent = options.text;
    if (options.html) el.innerHTML = options.html;
    if (options.contenteditable) el.contentEditable = options.contenteditable;
    // Set additional attributes if provided in options.attrs (an object)
    if (options.attrs) {
        Object.keys(options.attrs).forEach((key) => {
            el.setAttribute(key, options.attrs[key]);
        });
    }
    return el;
}

// ------------------------ Constants ------------------------

const BREAK_TAG = "<br/>";
const BUTTON_TAG = "button"; // Tag names for creation
const DIV_TAG = "div";
const SELECT_TAG = "select";
const OPTION_TAG = "option";
const SPAN_TAG = "span";

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

// ------------------------ GrammarManager ------------------------

/**
 * Manages grammar-related functionality such as refreshing output,
 * reparsing raw input, and handling errors.
 */
class GrammarManager {
    /**
     * @param {Object} grammarData - The initial grammar data.
     * @param {App} appInstance - Reference to the main App instance.
     */
    constructor(grammarData, appInstance) {
        this.grammar = grammarData || {};
        this.app = appInstance;
    }

    /**
     * Refreshes the grammar output display based on the current edit mode.
     */
    refreshGrammarOutput() {
        const holder = document.getElementById("grammar-holder");
        this._clearHtmlElement(holder);
        const rawGrammar = this.grammar.raw;
        const rawKeys = rawGrammar ? Object.keys(rawGrammar) : [];

        switch (this.app.editMode) {
            case editModes.visual:
                rawKeys.forEach((key) => {
                    const symbolContainer = this._createSymbolContainer(holder);
                    this._createKeyContainer(symbolContainer, key);
                    const rulesContainer = this._createRulesContainer(symbolContainer);
                    this._createAddRuleButton(symbolContainer);
                    const rawGrammarRules = rawGrammar[key];
                    if (!Array.isArray(rawGrammarRules)) return;
                    rawGrammarRules.forEach((rule, ruleIndex) => {
                        this._createRuleElement(rule, key, ruleIndex, rulesContainer);
                    });
                });
                break;
            case editModes.step: {
                const symbolKeys = Object.keys(this.grammar.symbols || {});
                symbolKeys.forEach((key) => {
                    const symbol = this.grammar.symbols[key];
                    const symbolContainer = this._createSymbolContainer(holder);
                    const keyContainer = this._createKeyContainer(symbolContainer, key);
                    if (symbol.isDynamic) {
                        keyContainer.classList.add("grammar__key--dynamic");
                    }
                    const rulesContainer = this._createRulesContainer(symbolContainer);
                    this._addRuleStack(rulesContainer, symbol.stack);
                });
                break;
            }
            default: {
                const grammarHolder = createElement(DIV_TAG, {
                    class: "grammar__json"
                });
                holder.appendChild(grammarHolder);
                const lines = this.generateGrammarLines(rawKeys, rawGrammar);
                const text = `{${BREAK_TAG}${lines.join(`,${BREAK_TAG}`)}${BREAK_TAG}}`;
                grammarHolder.innerHTML = text;
                grammarHolder.contentEditable = "true";
                grammarHolder.addEventListener(
                    "keyup",
                    debounce((event) => {
                        this.reparseGrammar(event.target.textContent);
                    }, 300)
                );
                break;
            }
        }
    }

    /**
     * Reparses the raw grammar string, validates it, and updates the grammar data.
     * @param {string} raw - The raw grammar input.
     */
    reparseGrammar(raw) {
        const errors = [];
        if (!raw) {
            errors.push({ index: 0, log: "Empty grammar, can't parse yet." });
            this.handleErrors(errors);
            return;
        }
        
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
        let json = {};
        try {
            json = JSON.parse(raw);
        } catch (e) {
            errors.push({ log: e.toString() });
        }
        // Update grammar data
        this.grammar = json;
        this.rebuildSymbolList();
    }

    /**
     * Displays errors in the UI.
     * @param {Array} errors - Array of error objects.
     */
    handleErrors(errors) {
        const elem = document.getElementById("errors");
        if (errors.length < 1) {
            elem.style.display = "none";
            return;
        }
        elem.style.display = "block";
        elem.innerHTML = "";
        errors.forEach((error) => {
            const errorDiv = createElement(DIV_TAG, {
                class: "error",
                text: `${error.index}: ${error.log}`
            });
            // Append closing tag string if needed (for consistency with the original code)
            errorDiv.innerHTML += "</div>";
            elem.appendChild(errorDiv);
        });
    }

    /**
     * Rebuilds the symbol list in the UI (e.g. the origin dropdown).
     */
    rebuildSymbolList() {
        if (!this.grammar || !this.grammar.symbols) return;
        const originOptions = Object.keys(this.grammar.symbols)
            .map((key) => this.app.uiController.wrapInOptionTag(key))
            .join("");
        const originSelect = document.getElementById("origin-select");
        if (originSelect) {
            originSelect.innerHTML = this.app.uiController.wrapInOptionTag("origin") + originOptions;
        }
    }

    /**
     * Generates formatted grammar lines for display.
     * @param {Array} keys
     * @param {Object} grammar
     * @returns {string[]} Array of formatted lines.
     */
    generateGrammarLines(keys, grammar) {
        const formatGrammarValue = (value) =>
            Array.isArray(value)
                ? value.map((item) => `"${item}"`).join(", ")
                : `"${value}"`;
        return keys.map((key) => {
            const formattedValue = formatGrammarValue(grammar[key]);
            return `"${BOLD_TAG_START}${key}${BOLD_TAG_END}": [${formattedValue}]`;
        });
    }

    // ----- “Private” helper methods (internal use only) -----

    _clearHtmlElement(elem) {
        elem.innerHTML = "";
    }

    _createSymbolContainer(holder) {
        const container = createElement(DIV_TAG, {
            class: "grammar__symbol-container"
        });
        holder.appendChild(container);
        return container;
    }

    _createKeyContainer(symbolContainer, key) {
        const keyEl = createElement(DIV_TAG, {
            class: "grammar__key-container",
            text: key
        });
        symbolContainer.appendChild(keyEl);
        return keyEl;
    }

    _createRulesContainer(symbolContainer) {
        const container = createElement(DIV_TAG, {
            class: "grammar__rules-container"
        });
        symbolContainer.appendChild(container);
        return container;
    }

    _createAddRuleButton(symbolContainer) {
        const btn = createElement("button", {
            class: "grammar__button grammar__button--add-rule",
            text: "Add Rule"
        });
        btn.addEventListener("click", () => {
            console.log("Add rule clicked");
            // Implement rule addition logic here.
        });
        symbolContainer.appendChild(btn);
        return btn;
    }

    _createRuleElement(rule, key, ruleIndex, rulesContainer) {
        const ruleEl = createElement(DIV_TAG, {
            class: "grammar__rule",
            text: rule
        });
        rulesContainer.appendChild(ruleEl);
        return ruleEl;
    }

    _addRuleStack(rulesContainer, stack) {
        stack.forEach((rule) => {
            const item = createElement(DIV_TAG, {
                class: "grammar__rule-stack-item",
                text: rule
            });
            rulesContainer.appendChild(item);
        });
    }
}

// ------------------------ VisualizationManager ------------------------

/**
 * Handles visualization mode changes and updates the UI accordingly.
 */
class VisualizationManager {
    /**
     * @param {App} appInstance - Reference to the main App instance.
     */
    constructor(appInstance) {
        this.app = appInstance;
    }

    /**
     * Sets the visualization mode.
     * @param {string} vizMode - The new visualization mode.
     */
    setVisualization(vizMode) {
        console.log(`Setting viz mode: ${vizMode}`);
        const visualizationEl = document.getElementById("visualization");
        if (visualizationEl) {
            visualizationEl.style.display = "block";
        }
        this.app.vizMode = vizMode;
        this.refreshVisualization();
    }

    /**
     * Refreshes the visualization based on the current mode.
     */
    refreshVisualization() {
        const holder = document.querySelector("#visualization .visualization__holder");
        if (!holder) return;
        holder.innerHTML = ""; // Clear contents

        switch (this.app.vizMode) {
            case visualizationModes.distribution: {
                const virtualGen = 100;
                for (let i = 0; i < virtualGen; i++) {
                    const root = this.app.generateRoot();
                    root.expand();
                }
                if (this.app.grammarManager.grammar.distributionVisualization) {
                    this.app.grammarManager.grammar.distributionVisualization(holder);
                }
                break;
            }
            case visualizationModes.expansion:
                if (!this.app.generatedRoots) return;
                this.app.generatedRoots.forEach((root) => {
                    root.visualizeExpansion(holder, { active: this.app.stepIterator.node });
                });
                break;
            default:
                break;
        }
    }
}

// ------------------------ UIController ------------------------

/**
 * Manages creation of UI elements and event handling.
 */
class UIController {
    /**
     * @param {App} appInstance - Reference to the main App instance.
     */
    constructor(appInstance) {
        this.app = appInstance;
    }

    /**
     * Binds the user input event on the text area to process new input.
     */
    bindUserInput(inputClassName) {
        const inputEl = document.querySelector(inputClassName);
        if (inputEl) {
            // Using debounce to avoid excessive processing.
            inputEl.addEventListener('input', debounce((event) => {
                const newText = event.target.value;
                // Delegate processing of user input to the App instance.
                this.app.processUserInput(newText);
            }, 300));
            
            this.app.logController.log("User input bound to event listener.");
        }
    }

    /**
     * Wraps a text value in an HTML option tag.
     * @param {string} text
     * @returns {string}
     */
    wrapInOptionTag(text) {
        return `<${OPTION_TAG}>${text}</${OPTION_TAG}>`;
    }

    createOriginSelectDropdown(elemToAppendTo) {
        const select = createElement(SELECT_TAG, {
            id: "origin-select",
            class: "app__select app__select--origin"
        });
        select.addEventListener("change", (event) => {
            this.app.origin = event.target.value;
            this.app.generate();
        });
        elemToAppendTo.appendChild(select);
        return select;
    }

    createVisualizationSelectDropdown() {
        const select = createElement(SELECT_TAG, {
            id: "visualization-select",
            class: "visualization__select",
            html: Object.keys(visualizationModes)
                .map((mode) => this.wrapInOptionTag(mode))
                .join("")
        });
        const container = document.querySelector("#visualization .visualization__controls");
        if (container) {
            container.appendChild(select);
        }
        select.addEventListener("change", (event) => {
            this.app.visualizationManager.setVisualization(event.target.value);
        });
        return select;
    }

    createGenerateCountSelectDropdown(elemToAppendTo) {
        const select = createElement(SELECT_TAG, {
            id: "generate-count",
            class: "app__select app__select--generate-count",
            html: [1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 60, 100]
                .map((num) => this.wrapInOptionTag(num))
                .join("")
        });
        select.addEventListener("change", (event) => {
            this.app.generateCount = parseInt(event.target.value, 10);
            this.app.generate();
        });
        elemToAppendTo.appendChild(select);
        return select;
    }

    createRerollButton(elemToAppendTo) {
        const btn = createElement(BUTTON_TAG, {
            class: "app__button app__button--reroll",
            text: "reroll"
        });
        btn.addEventListener("click", () => {
            if (this.app.seedLocked) {
                this.app.toggleSeedLock();
            }
            this.app.generate();
        });
        elemToAppendTo.appendChild(btn);
        return btn;
    }

    createStepButton(elemToAppendTo) {
        const btn = createElement(BUTTON_TAG, {
            class: "app__button app__button--step",
            text: "step"
        });
        btn.addEventListener("click", () => {
            this.app.generate(true); // generate without recursion
            if (this.app.isStepping) {
                clearInterval(this.app.stepTimer);
            } else {
                this.app.stepTimer = setInterval(() => {
                    this.app.stepIterator.node.expand(true);
                    const action = this.app.stepIterator.next();
                    if (this.app.stepIterator.mode === 2 || this.app.stepIterator.mode === 0) {
                        this.app.stepIterator.next();
                    }
                    if (!action) clearInterval(this.app.stepTimer);
                    this.app.visualizationManager.refreshVisualization();
                    this.app.grammarManager.refreshGrammarOutput();
                }, 40);
            }
        });
        elemToAppendTo.appendChild(btn);
        return btn;
    }

    createGenSeedControls(elemToAppendTo) {
        const seedEl = createElement(DIV_TAG, {
            id: "gen-seed",
            class: "app__seed app__seed--editable",
            contenteditable: "true"
        });
        seedEl.addEventListener(
            "keyup",
            debounce((event) => {
                if (!this.app.seedLocked) this.app.toggleSeedLock();
                this.app.setSeed(event.target.textContent, false, true);
            }, 300)
        );
        elemToAppendTo.appendChild(seedEl);

        const seedLockEl = createElement(DIV_TAG, {
            id: "gen-seed-lock",
            class: "app__seed-lock"
        });
        seedLockEl.addEventListener("click", () => {
            this.app.toggleSeedLock();
        });
        elemToAppendTo.appendChild(seedLockEl);
    }

    createGrammarTitleControls() {
        const titleEl = createElement(DIV_TAG, {
            class: "grammar__title",
            text: "My Grammar",
            contenteditable: "true"
        });
        const container = document.querySelector("#grammar .grammar__content-header .grammar__title-container");
        if (container) {
            container.appendChild(titleEl);
        }
        titleEl.addEventListener(
            "keyup",
            debounce((event) => {
                this.app.renameGrammar(event.target.textContent);
            }, 300)
        );
        return titleEl;
    }

    createGrammarSelectControl(elemToAppendTo) {
        const select = createElement(SELECT_TAG, {
            id: "grammar-select",
            class: "grammar__select",
            html:
                typeof testGrammars !== "undefined"
                    ? Object.keys(testGrammars)
                        .map((item) => this.wrapInOptionTag(item))
                        .join("")
                    : ""
        });
        select.addEventListener("change", (event) => {
            const grammarName = event.target.value;
            this.app.loadGrammar(typeof testGrammars !== "undefined" ? testGrammars[grammarName] : null);
            this.app.generate();
        });
        elemToAppendTo.appendChild(select);
        return select;
    }

    createLoginControls(elemToAppendTo) {
        const span = createElement(SPAN_TAG, {
            text: "login",
            class: "login__id"
        });
        elemToAppendTo.appendChild(span);
        return span;
    }

    createEditModeDropdown(elemToAppendTo) {
        const select = createElement(SELECT_TAG, {
            id: "grammar-mode-select",
            class: "grammar__select grammar__select--mode",
            html: [editModes.json, editModes.visual, editModes.step]
                .map((mode) => this.wrapInOptionTag(mode))
                .join("")
        });
        select.addEventListener("change", (event) => {
            this.app.editMode = event.target.value;
            this.app.grammarManager.refreshGrammarOutput();
        });
        elemToAppendTo.appendChild(select);
        return select;
    }
}

class LogController {
    constructor(appInstance) {
        this.app = appInstance;
        this.logElem = null;
    }
    
    bindLogElement(logClassName) {
        this.logElem = document.querySelector(logClassName);
        console.log(`Log element bound to ${logClassName} ==> Set-up Successful: ${this.logElem !== null}`);
        this.clearLog();
    }
    
    _getLogTimestampedLogText(text){
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}]  ${text}\n`;
    }
    
    log(message) {
        if (this.logElem) {
            //this.logElem.textContent += this._getLogTimestampedLogText(message);
            const newLogElem = document.createElement("p");
            this.logElem.appendChild(newLogElem);
            newLogElem.textContent = this._getLogTimestampedLogText(message);
        }
    }
    
    clearLog() {
        if (this.logElem) {
            this._clearHtmlElement(this.logElem);
            this.log("New Log Started...");
            //this.logElem.textContent = this._getLogTimestampedLogText("New Log Started...");
        }
    }

    _clearHtmlElement(elem) {
        elem.innerHTML = "";
    }
    
}

// ------------------------ App ------------------------

/**
 * Main application class that holds the state and coordinates the other modules.
 */
class App {
    /**
     * @param {Object} [grammarData=null] - Optional grammar data to inject.
     */
    constructor(grammarData = null) {
        // Use injected grammar data or fallback to a global variable.
        this.grammar = grammarData || (window.grammar ? window.grammar : {});
        this.generateCount = 1;
        this.mode = appModes.undefined;
        this.seedLocked = false;
        this.vizMode = visualizationModes.expansion;
        this.editMode = editModes.json;
        this.genSeed = null;
        this.generatedRoots = [];
        this.stepIterator = { node: null, next: () => null, mode: 0 };
        this.isStepping = false;

        // Instantiate managers.
        this.grammarManager = new GrammarManager(this.grammar, this);
        this.visualizationManager = new VisualizationManager(this);
        this.uiController = new UIController(this);
        this.logController = new LogController(this);
    }

    /**
     * Initializes the application when the document is ready.
     */
    init() {
        window.addEventListener("DOMContentLoaded", () => {
            console.log("App Starting...");
            this.setMode(appModes.authoring);
        });
    }

    processUserInput(newText){
        const tokenMaps = LexCharsToTokenMaps(newText);
        const tokenMapsStr = tokenMaps.map((tokenMap) => tokenMap.tid).join(" ");
        this.logController.log(`Tokenized user input: ${tokenMapsStr}`);
    }

    /**
     * Sets the application mode and initializes corresponding UI elements.
     * @param {string} mode
     */
    setMode(mode) {
        console.log(`Setting Application mode ${mode}`);
        this.editMode = editModes.json;
        this.setDefaultUIView();

        switch (mode) {
            case appModes.authoring: {
                const outputControls = document.querySelector("#output .output__controls");
                if (outputControls) {
                    this.uiController.createOriginSelectDropdown(outputControls);
                    this.uiController.createVisualizationSelectDropdown();
                    this.uiController.createGenerateCountSelectDropdown(outputControls);
                    this.uiController.createRerollButton(outputControls);
                    this.uiController.createStepButton(outputControls);
                    this.uiController.createGenSeedControls(outputControls);
                }
                const grammarControls = document.querySelector("#grammar .grammar__controls");
                if (grammarControls) {
                    this.uiController.createGrammarTitleControls();
                    // Optionally, uncomment the next line to enable a grammar selection dropdown:
                    // this.uiController.createGrammarSelectControl(grammarControls);
                    this.uiController.createLoginControls(grammarControls);
                    this.uiController.createEditModeDropdown(grammarControls);
                }
                break;
            }
            case appModes.tutorial:
                // Setup tutorial mode UI if needed.
                break;
            case appModes.browsing:
                // Setup browsing mode UI if needed.
                break;
            default:
                break;
        }
        this.executeWithDefaults();
    }

    /**
     * Adjusts the default view by showing/hiding UI elements.
     */
    setDefaultUIView() {
        const navCol = document.getElementById("nav-col");
        if (navCol) navCol.style.display = "none";
        const editCol = document.getElementById("edit-col");
        if (editCol) editCol.style.display = "block";
        const contentCol = document.getElementById("content-col");
        if (contentCol) contentCol.style.display = "block";
        const grammarModeSelect = document.getElementById("grammar-mode-select");
        if (grammarModeSelect) grammarModeSelect.value = this.editMode;
    }

    /**
     * Sets the seed value and optionally regenerates content.
     * @param {number|string} val
     * @param {boolean} updateDisplay
     * @param {boolean} regenerate
     */
    setSeed(val, updateDisplay, regenerate) {
        if (regenerate) this.generate();
        if (updateDisplay) {
            const genSeedEl = document.getElementById("gen-seed");
            if (genSeedEl) genSeedEl.textContent = this.genSeed;
        }
        this.genSeed = val;
    }

    /**
     * Generates a random seed.
     */
    setRandomSeed() {
        this.setSeed(Math.floor(Math.random() * 9999999), true, false);
    }

    /**
     * Toggles the seed lock status and updates the UI.
     */
    toggleSeedLock() {
        this.seedLocked = !this.seedLocked;
        const seedLockEl = document.getElementById("gen-seed-lock");
        if (seedLockEl) {
            if (this.seedLocked) {
                seedLockEl.classList.add("app__seed-lock--locked");
            } else {
                seedLockEl.classList.remove("app__seed-lock--locked");
            }
        }
        console.log("Seed locked:", this.seedLocked);
    }

    /**
     * Executes default operations such as setting a random seed and initializing visualizations.
     */
    executeWithDefaults() {
        this.setRandomSeed();
        const grammarSelect = document.getElementById("grammar-select");
        if (grammarSelect) {
            grammarSelect.value = "landscape";
        }
        // Optionally load a default grammar:
        // this.loadGrammar(testGrammars[grammarSelect.value]);
        // this.generate();
        this.visualizationManager.setVisualization(visualizationModes.expansion);
    }

    /**
     * Placeholder for the generate logic.
     * @param {boolean} [skipRecursion=false]
     */
    generate(skipRecursion = false) {
        console.log("Generate method called", skipRecursion ? "(skip recursion)" : "");
        // Add generation logic here.
    }

    /**
     * Returns a dummy root object with an expand method.
     */
    generateRoot() {
        return {
            expand: (flag) => console.log("Root expanded", flag ? "with flag" : "")
        };
    }

    /**
     * Placeholder for renaming grammar.
     * @param {string} text
     */
    renameGrammar(text) {
        console.log("Renaming grammar to:", text);
        // Implement renaming logic here.
    }

    /**
     * Loads a new grammar object into the application.
     * @param {Object} grammarData
     */
    loadGrammar(grammarData) {
        this.grammar = grammarData;
        this.grammarManager.grammar = grammarData;
    }
}

// ------------------------ Initialization ------------------------

// Instantiate and initialize the application.
const myApp = new App();
myApp.init();
