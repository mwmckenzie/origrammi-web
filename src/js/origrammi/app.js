
// Define the app object
const app = {
    generateCount: 1,
    mode: undefined,
    grammar: grammar,
    seedLocked: false,
    vizMode: undefined,
};

// When the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    console.log("start");
    setMode("authoring");
});

// Ways to interact

function setVisualization(vizMode) {
    console.log("set viz mode: " + vizMode);

    const visualizationElement = document.getElementById("visualization");
    if (visualizationElement) {
        visualizationElement.style.display = "block";
    }

    app.vizMode = vizMode;
    refreshVisualization();
}

function setMode(mode) {
    app.grammar = tracery.createGrammar();
    app.grammar.addModifiers(baseEngModifiers);

    let currentMode = mode;
    console.log("Set mode " + currentMode);

    // Set to default view
    document.getElementById("nav-col").style.display = "none";
    document.getElementById("edit-col").style.display = "block";
    document.getElementById("content-col").style.display = "block";
    app.editMode = "json";
    document.getElementById("grammar-mode-select").value = "json";

    // Clear headers
    switch (currentMode) {
        case "authoring":
            // Prepare Handlebars templates
            const outputControlsTemplate = `
                <select id="origin-select"></select>
                <select id="visualization-select">
                    {{#each visualizationOptions}}
                        <option>{{this}}</option>
                    {{/each}}
                </select>
                <select id="generate-count">
                    {{#each generateCounts}}
                        <option>{{this}}</option>
                    {{/each}}
                </select>
                <button id="reroll-btn">reroll</button>
                <button id="step-btn">step</button>
                <div id="gen-seed" contenteditable="true"></div>
                <div id="gen-seed-lock"></div>
            `;

            const grammarControlsTemplate = `
                <div class="grammar-title" contenteditable="true">My Grammar</div>
                <select id="grammar-select">
                    {{#each grammarOptions}}
                        <option>{{this}}</option>
                    {{/each}}
                </select>
                <span class="login-id">login</span>
                <select id="grammar-mode-select">
                    {{#each grammarModes}}
                        <option>{{this}}</option>
                    {{/each}}
                </select>
            `;

            // Data for templates
            const outputControlsData = {
                visualizationOptions: ["expansion", "distribution"],
                generateCounts: [1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 60, 100],
            };

            const grammarControlsData = {
                grammarOptions: Object.keys(testGrammars),
                grammarModes: ["json", "visual", "step"],
            };

            // Compile templates
            const outputControlsCompiled = Handlebars.compile(outputControlsTemplate);
            const grammarControlsCompiled = Handlebars.compile(grammarControlsTemplate);

            // Render templates and insert into the DOM
            document.querySelector("#output .content-header .controls").innerHTML = outputControlsCompiled(outputControlsData);
            document.querySelector("#grammar .controls").innerHTML = grammarControlsCompiled(grammarControlsData);

            // Add event listeners
            document.getElementById("origin-select").addEventListener("change", function () {
                app.origin = this.value;
                generate();
            });

            document.getElementById("visualization-select").addEventListener("change", function () {
                setVisualization(this.value);
            });

            document.getElementById("generate-count").addEventListener("change", function () {
                app.generateCount = parseInt(this.value, 10);
                generate();
            });

            document.getElementById("reroll-btn").addEventListener("click", function () {
                if (app.seedLocked) toggleSeedLock();
                generate();
            });

            document.getElementById("gen-seed").addEventListener("keyup", function () {
                if (!app.seedLocked) toggleSeedLock();
                setSeed(this.textContent, false, true);
            });

            document.getElementById("gen-seed-lock").addEventListener("click", function () {
                toggleSeedLock();
            });

            document.querySelector(".grammar-title").addEventListener("keyup", function () {
                renameGrammar(this.textContent);
            });

            document.getElementById("grammar-select").addEventListener("change", function () {
                const grammarName = this.value;
                loadGrammar(testGrammars[grammarName]);
                generate();
            });

            document.getElementById("grammar-mode-select").addEventListener("change", function () {
                app.editMode = this.value;
                refreshGrammarOutput();
            });

            break;

        case "tutorial":
            break;

        case "browsing":
            break;
    }

    setSeed(Math.floor(Math.random() * 9999999), true);

    document.getElementById("grammar-select").value = "landscape";
    loadGrammar(testGrammars[document.getElementById("grammar-select").value]);
    generate();
    setVisualization("expansion");
}

//===============================================================
// Generate
function setSeed(val, updateDisplay, regenerate) {
    app.genSeed = val;
    if (regenerate) generate();
    if (updateDisplay) {
        const seedElement = document.getElementById("gen-seed");
        if (seedElement) {
            seedElement.textContent = app.genSeed;
        }
    }
}

function toggleSeedLock() {
    app.seedLocked = !app.seedLocked;
    const seedLockElement = document.getElementById("gen-seed-lock");
    if (seedLockElement) {
        if (app.seedLocked) {
            seedLockElement.classList.add("locked");
        } else {
            seedLockElement.classList.remove("locked");
        }
    }
    console.log(app.seedLocked);
}

function reparseGrammar(raw) {
    const errors = [];
    const errorsElement = document.getElementById("errors");

    // Validate raw input
    if (raw !== undefined) {
        console.log("Reparsing from raw: " + raw);
        raw = raw.trim();

        if (raw.length === 0) {
            errors.push({ index: 0, log: "Empty grammar, can't parse yet." });
        }
        if (raw.charAt(0) !== "{") {
            errors.push({ index: 0, log: "JSON must start with {, missing {" });
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
            errors.push({ log: e.message });
        }

        // Load grammar from the parsed JSON object
        app.grammar.loadFromRawObj(json);

        if (errors.length > 0 && errorsElement) {
            // Prepare Handlebars template for errors
            const errorsTemplate = `
                {{#each errors}}
                    <div class="error">{{index}}: {{log}}</div>
                {{/each}}
            `;

            const errorsCompiled = Handlebars.compile(errorsTemplate);
            errorsElement.innerHTML = errorsCompiled({ errors });
            errorsElement.style.display = "block";
        }
    }

    rebuildSymbolList();
}

function rebuildSymbolList() {
    const originSelectElement = document.getElementById("origin-select");
    if (originSelectElement) {
        // Prepare Handlebars template for symbol options
        const originOptionsTemplate = `
            <option>origin</option>
            {{#each symbols}}
                <option>{{this}}</option>
            {{/each}}
        `;

        const symbols = Object.keys(app.grammar.symbols);
        const originOptionsCompiled = Handlebars.compile(originOptionsTemplate);

        originSelectElement.innerHTML = originOptionsCompiled({ symbols });
    }
}

// Use the current grammar to generate a parseable object
function generateRoot() {
    let origin = app.origin || "origin";
    return app.grammar.createRoot(`#${origin}#`);
}