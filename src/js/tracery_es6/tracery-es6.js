/**
 * @file tracery.js
 * @description Refactored Tracery script using ES6 classes and modern best practices.
 */

const BUTTON_TAG = "button"; // Tag names for creation
const DIV_TAG = "div";
const SELECT_TAG = "select";
const OPTION_TAG = "option";
const SPAN_TAG = "span";

/**
 * Enum for node types.
 * @readonly
 * @enum {number}
 */
const NodeType = {
    RAW:    -1,  // A raw rule (unparsed)
    TEXT:    0,  // Plain text
    TAG:     1,  // Tag, e.g. #symbol.mod#
    ACTION:  2,  // Action, e.g. [key:rule] or [key:POP]
};

/**
 * Enum for distribution types.
 * @readonly
 * @enum {string}
 */
const DistributionType = {
    RANDOM:  'random',
    SHUFFLE: 'shuffle',
    WEIGHTED:'weighted',
    FALLOFF: 'falloff',
};

/**
 * BEM-like CSS constants for test DOM manipulation.
 */
const CLASS_CONTENT_COLUMN       = 'content__col';
const CLASS_CARD                 = 'card';
const CLASS_CARD_DEBUG_OUTPUT    = 'card--debug-output';

/**
 * Utility function to shuffle an array using the Fisher-Yates method.
 * @param {number[]} array - The array of indices to shuffle.
 * @param {number} falloff - The "falloff" exponent for random distribution.
 * @returns {number[]} The shuffled array.
 */
function fisherYatesShuffle(array, falloff) {
    let currentIndex = array.length;
    let temporaryValue;
    let randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Class representing a single action (push, pop, function call, etc.)
 * that occurs when a node is expanded.
 */
class NodeAction {
    /**
     * Create a NodeAction.
     * @param {TraceryNode} node - The node to which this action belongs.
     * @param {string} raw - The raw action string (e.g. "[key:rule]" or "[key:POP]").
     */
    constructor(node, raw) {
        if (!node) {
            console.warn('No node provided for NodeAction');
        }
        if (!raw) {
            console.warn('No raw command provided for NodeAction');
        }

        this.node = node;
        const sections = raw.split(':');
        this.target = sections[0];

        // If there is no colon, assume it's a function
        if (sections.length === 1) {
            this.type = 2; // function
        } else {
            this.rule = sections[1];
            if (this.rule === 'POP') {
                this.type = 1; // pop
            } else {
                this.type = 0; // push
            }
        }
    }

    /**
     * Activate (perform) this action.
     */
    activate() {
        const grammar = this.node.grammar;
        switch (this.type) {
            // Push
            case 0: {
                const ruleNode = new TraceryNode(grammar, 0, {
                    type: NodeType.RAW,
                    raw: this.rule,
                });
                ruleNode.expand();
                this.ruleText = ruleNode.finishedText;

                grammar.pushRules(this.target, this.ruleText, this);
                console.log(`Push rules: ${this.target} => ${this.ruleText}`);
                break;
            }
            // Pop
            case 1:
                // Implementation for popping can be added here if needed
                break;
            // Function
            case 2:
                // Implementation for function calls can be added here
                break;
            default:
                console.warn(`Unknown action type: ${this.type}`);
                break;
        }
    }
}

/**
 * Class representing a set of rules.
 * May include fallback sets or conditional sets in the future.
 */
class RuleSet {
    /**
     * @param {Grammar} grammar - The parent grammar instance.
     * @param {string|string[]|object} raw - The raw rule(s) for this RuleSet.
     */
    constructor(grammar, raw) {
        this.grammar = grammar;
        this.raw = raw;
        this.falloff = 1;
        this.distribution = grammar.distribution || DistributionType.RANDOM;

        if (Array.isArray(raw)) {
            this.defaultRules = raw;
        } else if (typeof raw === 'string' || raw instanceof String) {
            this.defaultRules = [raw];
        } else if (typeof raw === 'object') {
            // Future support for object-based rule sets (conditionals, etc.)
        }

        this.shuffledDeck = null;
    }

    /**
     * Get a single rule from this RuleSet.
     * @returns {string|undefined} The selected rule or undefined if none.
     */
    getRule() {
        // Conditional expansions are not yet implemented
        // Ranked expansions are not yet implemented

        if (this.defaultRules) {
            let index = 0;

            switch (this.distribution) {
                case DistributionType.SHUFFLE:
                    if (!this.shuffledDeck || this.shuffledDeck.length === 0) {
                        // Create array of indices 0..N-1
                        const arrayOfIndices = Array.from(
                            { length: this.defaultRules.length },
                            (_, i) => i
                        );
                        this.shuffledDeck = fisherYatesShuffle(arrayOfIndices, this.falloff);
                    }
                    index = this.shuffledDeck.pop();
                    break;

                case DistributionType.WEIGHTED:
                    // Weighted distribution not implemented
                    break;

                case DistributionType.FALLOFF:
                    // Falloff distribution not implemented specifically
                    break;

                default:
                    // Random distribution
                    index = Math.floor(Math.pow(Math.random(), this.falloff) * this.defaultRules.length);
                    break;
            }

            if (!this.defaultUses) {
                this.defaultUses = [];
            }
            this.defaultUses[index] = (this.defaultUses[index] || 0) + 1;
            return this.defaultRules[index];
        }
        return undefined;
    }

    /**
     * Clear state of uses, deck, etc.
     */
    clearState() {
        if (this.defaultUses) {
            this.defaultUses = [];
        }
        this.shuffledDeck = null;
    }
}

/**
 * Class representing a symbol within the grammar.
 * (Renamed from "Symbol" to avoid conflicts with the ES6 Symbol type.)
 */
class SymbolDefinition {
    /**
     * @param {Grammar} grammar - The parent grammar.
     * @param {string} key - The identifier for this symbol.
     * @param {string|string[]|object} rawRules - The raw rule(s).
     */
    constructor(grammar, key, rawRules) {
        this.grammar = grammar;
        this.key = key;
        this.rawRules = rawRules;

        this.baseRules = new RuleSet(this.grammar, rawRules);
        this.clearState();
    }

    /**
     * Clear the internal state of this symbol.
     */
    clearState() {
        this.stack = [this.baseRules];
        this.uses = [];
        this.baseRules.clearState();
    }

    /**
     * Push new rule(s) on top of this symbol's stack.
     * @param {string|string[]|object} rawRules - The new rule(s) to push.
     */
    pushRules(rawRules) {
        const rules = new RuleSet(this.grammar, rawRules);
        this.stack.push(rules);
    }

    /**
     * Pop the most recent rule set from this symbol's stack.
     */
    popRules() {
        this.stack.pop();
    }

    /**
     * Select a rule from the top rule set in the stack.
     * @param {TraceryNode} node - The node requesting this symbol's rule.
     * @returns {string} The selected rule.
     */
    selectRule(node) {
        this.uses.push({ node });
        if (this.stack.length === 0) {
            throw new Error(`No rules for symbol: ${this.key}`);
        }
        return this.stack[this.stack.length - 1].getRule();
    }
}

/**
 * Class representing a Tracery node in the parse tree.
 */
class TraceryNode {
    /**
     * @param {TraceryNode|Grammar} parent - Either the parent node or the root Grammar object.
     * @param {number} childIndex - The index of this node among its parent's children.
     * @param {object} settings - Additional settings (e.g. type, raw).
     */
    constructor(parent, childIndex, settings) {
        if (settings.raw === undefined) {
            throw new Error('No raw input for node');
        }

        if (parent instanceof Grammar) {
            // Root node
            this.grammar = parent;
            this.parent = null;
            this.depth = 0;
            this.childIndex = 0;
        } else {
            this.grammar = parent.grammar;
            this.parent = parent;
            this.depth = parent.depth + 1;
            this.childIndex = childIndex;
        }

        this.raw = settings.raw;
        this.type = settings.type;
        this.isExpanded = false;
        this.finishedText = '';

        if (!this.grammar) {
            console.warn('No grammar specified for this node', this);
        }
    }

    /**
     * Convert this node to a string for debugging.
     * @returns {string} String representation of the node.
     */
    toString() {
        return `Node('${this.raw}' ${this.type} d:${this.depth})`;
    }

    /**
     * Expand this node's children based on a child rule.
     * @param {string} childRule - The rule used to create child nodes.
     * @param {boolean} preventRecursion - Whether recursion is disabled.
     */
    expandChildren(childRule, preventRecursion) {
        this.children = [];
        this.finishedText = '';

        this.childRule = childRule;
        if (this.childRule !== undefined) {
            const sections = tracery.parse(childRule);
            for (let i = 0; i < sections.length; i++) {
                this.children[i] = new TraceryNode(this, i, sections[i]);
                if (!preventRecursion) {
                    this.children[i].expand(preventRecursion);
                }
                this.finishedText += this.children[i].finishedText;
            }
        } else {
            console.warn('No child rule provided, cannot expand children');
        }
    }

    /**
     * Expand this node in place.
     * @param {boolean} preventRecursion - Whether recursion is disabled.
     */
    expand(preventRecursion) {
        if (this.isExpanded) {
            // Already expanded
            return;
        }
        this.isExpanded = true;
        this.expansionErrors = [];

        switch (this.type) {
            case NodeType.RAW: {
                // -1 means a raw, unparsed rule; we parse and expand children
                this.expandChildren(this.raw, preventRecursion);
                break;
            }
            case NodeType.TEXT: {
                // 0 means plain text
                this.finishedText = this.raw;
                break;
            }
            case NodeType.TAG: {
                // 1 means a tag, e.g. #symbol.mod.mod2#
                this.preactions = [];
                const parsed = tracery.parseTag(this.raw);
                this.symbol = parsed.symbol;
                this.modifiers = parsed.modifiers;

                // Preactions
                if (parsed.preactions.length > 0) {
                    this.preactions = [];
                    for (let i = 0; i < parsed.preactions.length; i++) {
                        this.preactions[i] = new NodeAction(this, parsed.preactions[i].raw);
                    }
                    // Activate all preactions
                    for (const action of this.preactions) {
                        action.activate();
                    }
                }

                // Select and expand the symbol's rule
                const selectedRule = this.grammar.selectRule(this.symbol, this);
                if (!selectedRule) {
                    this.expansionErrors.push({
                        log: 'Child rule not created',
                    });
                }
                this.expandChildren(selectedRule, preventRecursion);

                // Apply modifiers
                for (const modifierName of this.modifiers) {
                    const modifierFn = this.grammar.modifiers[modifierName];
                    if (!modifierFn) {
                        this.finishedText += `((.${modifierName}))`;
                    } else {
                        this.finishedText = modifierFn(this.finishedText);
                    }
                }
                break;
            }
            case NodeType.ACTION: {
                // 2 means an action, e.g. [key:rule]
                this.preActions = [new NodeAction(this, this.raw)];
                this.preActions[0].activate();
                this.finishedText = '';
                break;
            }
            default:
                console.warn(`Unknown node type: ${this.type}`);
                break;
        }
    }
}

/**
 * Class representing a Tracery grammar.
 */
class Grammar {
    /**
     * @param {object} raw - The raw object mapping keys to rule sets.
     * @param {object} [settings] - Optional settings, e.g. distribution, fallback, etc.
     */
    constructor(raw, settings = {}) {
        this.raw = null;
        this.modifiers = {};
        this.symbols = {};
        this.subgrammars = [];
        this.distribution = settings.distribution || DistributionType.RANDOM;
        this.loadFromRawObj(raw);
    }

    /**
     * Clear the state of all symbols in this grammar.
     */
    clearState() {
        const keys = Object.keys(this.symbols);
        for (const key of keys) {
            this.symbols[key].clearState();
        }
    }

    /**
     * Add modifiers to this grammar.
     * @param {object} mods - A map of modifier names to modifier functions.
     */
    addModifiers(mods) {
        for (const [key, fn] of Object.entries(mods)) {
            this.modifiers[key] = fn;
        }
    }

    /**
     * Load symbols from a raw object of rule definitions.
     * @param {object} raw - The raw object with keys -> rule sets.
     */
    loadFromRawObj(raw) {
        this.raw = raw;
        if (this.raw) {
            for (const key in this.raw) {
                if (Object.hasOwnProperty.call(this.raw, key)) {
                    this.symbols[key] = new SymbolDefinition(this, key, this.raw[key]);
                }
            }
        }
    }

    /**
     * Create a root node for the given rule.
     * @param {string} rule - The rule text.
     * @returns {TraceryNode} The newly created root node.
     */
    createRoot(rule) {
        return new TraceryNode(this, 0, {
            type: NodeType.RAW,
            raw: rule,
        });
    }

    /**
     * Expand a rule, returning its root node.
     * @param {string} rule - The rule text.
     * @returns {TraceryNode} The expanded node.
     */
    expand(rule) {
        const root = this.createRoot(rule);
        root.expand();
        return root;
    }

    /**
     * A shortcut to expand a rule to its final text result.
     * @param {string} rule - The rule text.
     * @returns {string} The finished text of the expanded rule.
     */
    flatten(rule) {
        return this.expand(rule).finishedText;
    }

    /**
     * Push new rules onto a symbol.
     * @param {string} key - The symbol key.
     * @param {string|string[]|object} rawRules - The new rule(s) to push.
     * @param {NodeAction} [sourceAction] - The source action that triggered this push (if any).
     */
    pushRules(key, rawRules, sourceAction) {
        if (!this.symbols[key]) {
            this.symbols[key] = new SymbolDefinition(this, key, rawRules);
            if (sourceAction) {
                this.symbols[key].isDynamic = true;
            }
        } else {
            this.symbols[key].pushRules(rawRules);
        }
    }

    /**
     * Pop the most recently pushed rules from a symbol.
     * @param {string} key - The symbol key.
     */
    popRules(key) {
        if (!this.symbols[key]) {
            throw new Error(`No symbol for key: ${key}`);
        }
        this.symbols[key].popRules();
    }

    /**
     * Select a rule from a symbol by key.
     * @param {string} key - The symbol key.
     * @param {TraceryNode} node - The node requesting the rule.
     * @returns {string} The selected rule text.
     */
    selectRule(key, node) {
        if (this.symbols[key]) {
            return this.symbols[key].selectRule(node);
        }

        // Fallback to subgrammars
        for (const subgrammar of this.subgrammars) {
            if (subgrammar.symbols[key]) {
                return subgrammar.symbols[key].selectRule(node);
            }
        }

        // If not found, return placeholder text
        return `((${key}))`;
    }
}

/**
 * Utility object containing parsing methods, grammar creation, etc.
 */
const tracery = {
    /**
     * Create a Grammar instance from a raw mapping.
     * @param {object} raw - The raw grammar object.
     * @param {object} [settings] - Optional grammar settings.
     * @returns {Grammar} A new Grammar instance.
     */
    createGrammar(raw, settings) {
        return new Grammar(raw, settings);
    },

    /**
     * Parse the content of a tag (e.g., the inside of #...#).
     * @param {string} tagContents - The string inside a tag.
     * @returns {{symbol: string, preactions: object[], postactions: object[], modifiers: string[]}}
     */
    parseTag(tagContents) {
        const parsed = {
            symbol: undefined,
            preactions: [],
            postactions: [],
            modifiers: [],
        };

        const sections = tracery.parse(tagContents);
        let symbolSection;

        for (const section of sections) {
            if (section.type === NodeType.TEXT) {
                if (symbolSection === undefined) {
                    symbolSection = section.raw;
                } else {
                    throw new Error(`Multiple main sections in tag: ${tagContents}`);
                }
            } else {
                parsed.preactions.push(section);
            }
        }

        if (symbolSection !== undefined) {
            const components = symbolSection.split('.');
            parsed.symbol = components[0];
            parsed.modifiers = components.slice(1);
        }
        return parsed;
    },

    /**
     * Parse a rule string into sections.
     * @param {string} rule - The rule text to parse.
     * @returns {Array<{type: number, raw: string}> & { errors?: string[] }} The parsed sections.
     */
    parse(rule) {
        let depth = 0;
        let inTag = false;
        const sections = [];
        sections.errors = [];

        let start = 0;
        let escaped = false;
        let escapedSubstring = '';
        let lastEscapedChar;

        /**
         * Helper to create a section given a start and end index and a type.
         * @param {number} sectionStart
         * @param {number} sectionEnd
         * @param {number} type
         */
        function createSection(sectionStart, sectionEnd, type) {
            if (sectionEnd - sectionStart < 1) {
                sections.errors.push(`${sectionStart}: 0-length section of type ${type}`);
            }
            let rawSubstring;
            if (lastEscapedChar !== undefined) {
                rawSubstring = escapedSubstring + rule.substring(lastEscapedChar + 1, sectionEnd);
            } else {
                rawSubstring = rule.substring(sectionStart, sectionEnd);
            }
            sections.push({ type, raw: rawSubstring });
            lastEscapedChar = undefined;
            escapedSubstring = '';
        }

        for (let i = 0; i < rule.length; i++) {
            if (!escaped) {
                const c = rule.charAt(i);
                switch (c) {
                    case '[':
                        if (depth === 0 && !inTag) {
                            if (start < i) createSection(start, i, NodeType.TEXT);
                            start = i + 1;
                        }
                        depth++;
                        break;
                    case ']':
                        depth--;
                        if (depth === 0 && !inTag) {
                            createSection(start, i, NodeType.ACTION);
                            start = i + 1;
                        }
                        break;
                    case '#':
                        if (depth === 0) {
                            if (inTag) {
                                createSection(start, i, NodeType.TAG);
                                start = i + 1;
                            } else {
                                if (start < i) createSection(start, i, NodeType.TEXT);
                                start = i + 1;
                            }
                            inTag = !inTag;
                        }
                        break;
                    case '\\':
                        escaped = true;
                        escapedSubstring += rule.substring(start, i);
                        start = i + 1;
                        lastEscapedChar = i;
                        break;
                    default:
                        break;
                }
            } else {
                escaped = false;
            }
        }

        if (start < rule.length) {
            createSection(start, rule.length, NodeType.TEXT);
        }

        if (inTag) {
            sections.errors.push('Unclosed tag');
        }
        if (depth > 0) {
            sections.errors.push('Too many [');
        }
        if (depth < 0) {
            sections.errors.push('Too many ]');
        }

        return sections;
    },

    /**
     * Convert parsed sections into an HTML string (for debugging or display).
     * @param {Array<{type: number, raw: string}> & { errors?: string[] }} sections
     * @returns {string} The HTML representation of these sections.
     */
    parsedSectionsToHTML(sections) {
        let output = '';
        for (let i = 0; i < sections.length; i++) {
            output += `<span class="section-${sections[i].type}">${sections[i].raw}</span> `;
        }
        if (sections.errors) {
            for (const error of sections.errors) {
                output += `<span class="section-error">${error}</span> `;
            }
        }
        return output;
    },

    /**
     * Convert parsed sections into a DOM fragment (instead of an HTML string).
     * @param {Array<{type: number, raw: string}> & { errors?: string[] }} sections
     * @returns {DocumentFragment} A DOM fragment containing the sections.
     */
    parsedSectionsToDOM(sections) {
        
        // Create a fragment to hold all our span elements
        const fragment = document.createDocumentFragment();
    
        sections.forEach((section) => {
            // Create the <span> element
            const spanElement = document.createElement(SPAN_TAG);
            spanElement.classList.add(`section-${section.type}`);
            spanElement.textContent = section.raw;
    
            // Append the span to the fragment
            fragment.appendChild(spanElement);
    
            // Optionally add a trailing space
            fragment.appendChild(document.createTextNode(' '));
        });
    
        // If there were any parsing errors, display them
        if (sections.errors) {
            sections.errors.forEach((error) => {
                const errorSpan = document.createElement(SPAN_TAG);
                errorSpan.classList.add('section-error');
                errorSpan.textContent = error;
    
                fragment.appendChild(errorSpan);
                fragment.appendChild(document.createTextNode(' '));
            });
        }   
    
        return fragment;
    },

    /**
     * Example test function demonstrating how one might test parsing/expansion
     * without using jQuery. This function assumes an element in the DOM with
     * class="content__col".
     */
    test() {
        const contentColumn = document.querySelector(`.${CLASS_CONTENT_COLUMN}`);
        if (!contentColumn) {
            console.warn(`No element found with class "${CLASS_CONTENT_COLUMN}". Test aborted.`);
            return;
        }

        const testLogContainer = document.createElement('div');
        testLogContainer.classList.add(CLASS_CARD, CLASS_CARD_DEBUG_OUTPUT);
        contentColumn.appendChild(testLogContainer);

        const testGrammar = tracery.createGrammar({
            animal: ['capybara', 'unicorn', 'university', 'umbrella', 'u-boat', 'boa', 'ocelot', 'zebu', 'finch', 'fox', 'hare', 'fly'],
            color: ['yellow', 'maroon', 'indigo', 'ivory', 'obsidian'],
            mood: ['elated', 'irritable', 'morose', 'enthusiastic'],
            story: ['[mc:#animal#]Once there was #mc.a#, a very #mood# #mc#']
        });

        // Simple demonstration expansions
        for (let i = 0; i < 5; i++) {
            const expansion = testGrammar.expand('[test:#foo#]foo');
            console.log(`Expansion #${i}:`, expansion.finishedText);
        }

        // Example of how to parse a set of test strings
        const tests = [
            '',
            'a',
            'tracery',
            '#a#',
            'a#b#',
            'aaa#b##cccc#dd#eee##f#',
            '\\#test\\#',
            '\\[#test#\\]',
        ];

        tests.forEach((testString) => {
            const parsed = tracery.parse(testString);
            let output = `<span class="section-raw">${testString}</span> `;
            output += tracery.parsedSectionsToHTML(parsed);
            output = output.replace(/\\/g, '&#92;'); // Escape backslashes for display

            const paragraph = document.createElement('p');
            paragraph.innerHTML = output;
            testLogContainer.appendChild(paragraph);
        });
    },
};

/**
 * Exported members.
 */
export {
    tracery,
    NodeType,
    DistributionType,
    TraceryNode,
    Grammar,
    SymbolDefinition,
    RuleSet,
    NodeAction,
};
