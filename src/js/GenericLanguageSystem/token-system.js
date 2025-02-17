

const arity = Object.freeze({
    VOID: "VOID",   // 0 arguments
    UNARY: "UNARY",       // 1 argument
    BINARY: "BINARY",     // 2 arguments
    TERNARY: "TERNARY",   // 3 arguments
    QUATERNARY: "QUATERNARY", // 4 arguments
    NARY: "NARY",        // N arguments (variadic)
});

export default arity;


const ruleCategory = {
    identity: "identity",
    logical: "logical",
}

const ruleTypes = {
    // identity
    isA: "isA",
    isOnlyA: "isOnlyA",
    isSuperClassOf: "isSuperClassOf",
    isSubClassOf: "isSubClassOf",
    equals: "equals",
    
    // logical
    and: "and",
    or: "or",
    not: "not",
    zeroOrMore: "zeroOrMore",
    oneOrMore: "oneOrMore",
    zeroOrOne: "zeroOrOne",
    
    
    lessThan: "lessThan",
    greaterThan: "greaterThan",
    first: "first",
    last: "last",
};

/**
 * Determines if the Token identified by `tokenA` is a superclass of the Token identified by `tokenB`.
 *
 * This function checks whether the Token ID (`tid`) of `tokenA` exists in the list of ancestors of `tokenB`.
 *
 * @function
 * @param {Token} tokenA - An object representing a `Token`, which must include a `tid` property.
 * @param {Token} tokenB - An object representing another `Token`, which must include an `ancestors` property.
 *                          The `ancestors` property should be an array of `Token` objects, each containing a `tid` property.
 * @returns {boolean} Returns `true` if `tokenA.tid` is found in the `ancestors` of `tokenB`, otherwise returns `false`.
 */
const ruleIsSuperClassOf = function(tokenA, tokenB){
    return tokenB.ancestors.some(ancestor => tokenA.tokenID === ancestor.tid)
};

/**
 * Determines if the relationship between two tokens indicates
 * that `tokenA` is a subclass of `tokenB`.
 *
 * @function
 * @param {Token} tokenA - The first token to check as a potential subclass.
 * @param {Token} tokenB - The second token to check as a potential superclass.
 * @returns {boolean} Returns true if `tokenA` is determined to be a subclass
 * of `tokenB`, otherwise false.
 */
const ruleIsSubClassOf = function(tokenA, tokenB){
    return ruleIsSuperClassOf(tokenB, tokenA);
};

/**
 * Checks if two tokens have the same `tid` property.
 *
 * This function compares the `tid` properties of two token objects and
 * returns a boolean indicating whether they are equal.
 *
 * @function
 * @param {Token} tokenA - The first token object to be compared.
 * @param {Token} tokenB - The second token object to be compared.
 * @returns {boolean} - Returns true if the `tid` properties of both tokens are equal, otherwise false.
 */
const ruleIsOnlyA = function(tokenA, tokenB){
    return tokenA.tokenID === tokenB.tokenID;
};

/**
 * Determines if the given tokenA is either of the same type as tokenB or is a subclass of tokenB.
 *
 * @function
 * @param {Token} tokenA - The first token to evaluate.
 * @param {Token} tokenB - The second token to compare against.
 * @returns {boolean} - Returns true if tokenA is of the same type as or a subclass of tokenB, otherwise false.
 */
const ruleIsA = function(tokenA, tokenB){
    return ruleIsOnlyA(tokenA, tokenB) || ruleIsSubClassOf(tokenA, tokenB);
}


const ruleIsOneOf = function(tokenA, tokenList){
    return tokenList.some(token => ruleIsA(tokenA, token));
}



const getRuleByType = function(ruleType) {
    
    switch (ruleType) {
        case ruleTypes.isA:
            return ruleIsA;
        case ruleTypes.isSuperClassOf:
            return ruleIsSuperClassOf;
        case ruleTypes.isOnlyA:
            return ruleIsOnlyA;
            
            
            
    }
}

const testRules = function(ruleType) {
    const rule = getRuleByType(ruleType);
    const tokenA = new Token("LineSeparatorChar");
    const tokenB = new Token("UnixLineFeedChar");
    
    rule(tokenA, tokenB);
}

class TokenAncestors {
    constructor() {
        // 'tokens' will be a dictionary (object) where each key is a token
        // and its value is an array of unique ancestors.
        this.tokens = {};
    }

    /**
     * Adds an ancestor for a given token.
     * If the token is not already in the dictionary, it is added.
     * The ancestor is added only if it is not already present in the token's ancestor list.
     *
     * @param {string} tokenID - The token identifier.
     * @param {string} ancestorTokenID - The ancestor identifier.
     */
    addAncestor(tokenID, ancestorTokenID) {
        // If the token isn't already in the dictionary, add it with an empty array.
        if (!this.tokens[tokenID]) {
            this.tokens[tokenID] = [];
        }
        // Check if the ancestor is not already in the array before adding.
        if (!this.tokens[tokenID].includes(ancestorTokenID)) {
            this.tokens[tokenID].push(ancestorTokenID);
        }
    }
}


class Token{
    constructor(tid) {
        this.tokenID = tid;
        this.value = value;
        this.tokenComposition = [];
        this.ancestors = [];
    }
}

class TokenRule{
    constructor(rule, value) {
        this.rule = rule;
    }
}

class TokenRuleSet{
    constructor(rules) {
        this.rules = rules;
    }
}

/**
 * Class representing the result of a processing operation.
 */
class ProcessResult{

    remainingTokenSequence = null;
    pattern = null;
    wasSuccessful = false;
    token = null;
    
    /**
     * @param {Array<Token>} remainingTokenSequence - A sequence of tokens.
     * @param {Pattern} pattern - A sequence of tokens.
     * @param {boolean} wasSuccessful - A sequence of tokens.
     */
    constructor(remainingTokenSequence, pattern, wasSuccessful) {
        this.remainingTokenSequence = remainingTokenSequence;
        this.pattern = pattern;
        this.wasSuccessful = wasSuccessful;
        this.token = null;
    }
}

/**
 * Processes a given sequence of tokens based on a specified pattern.
 * This function evaluates if the token sequence matches the given pattern by analyzing its starting, middle, and ending tokens.
 * It performs validation checks against the pattern's constraints and generates a result containing the processed tokens and pattern information.
 *
 * @param {Array<Token>} tokenSequence - The sequence of tokens to be processed.
 * @param {Pattern} pattern - The pattern object containing criteria for validation.
 *
 * @returns {ProcessResult} - Returns an instance of `ProcessResult`, which contains information about the processed token sequence and its match status.
 */
const processPattern = function (tokenSequence, pattern) {
    
    const result = new ProcessResult(tokenSequence, pattern, false);
    const resultToken = new Token(pattern.representedTokenID);

    for (let i = 0; i < tokenSequence.length; i++) {

        const token = tokenSequence[i];

        if (i === 0 && pattern.validStartingTokens.length > 0){

            if (!ruleIsOneOf(token, pattern.validStartingTokens)){
                return result;
            }

            resultToken.tokenComposition.push(token);


        } else if (i > 0 && pattern.validMiddleTokens.length > 0){

        } else if (i === tokenSequence.length - 1 && pattern.validEndingTokens.length > 0){

        } else if (i > tokenSequence.length - 1 && pattern.validEndingTokens.length > 0){

        }
    }
    return result;
}

const takeWhile = function(predicate, sequence) {
    const result = [];
    for (let i = 0; i < sequence.length; i++) {
        if (!predicate(sequence[i])) {
            break;
        }
        result.push(sequence[i]);
    }
}

class Processor{
    constructor() {
    }
    
    processPattern(tokenSequence, pattern) {
        const result = new ProcessResult(tokenSequence, pattern, false);
        const resultToken = new Token(pattern.representedTokenID);
        
        for (let i = 0; i < tokenSequence.length; i++) {
            
            const token = tokenSequence[i];
            
            if (i === 0 && pattern.validStartingTokens.length > 0){
                
                if (!ruleIsOneOf(token, pattern.validStartingTokens)){
                    return result;
                }
                
                resultToken.tokenComposition.push(token);
                
                
            } else if (i > 0 && pattern.validMiddleTokens.length > 0){
                
            } else if (i === tokenSequence.length - 1 && pattern.validEndingTokens.length > 0){
                
            } else if (i > tokenSequence.length - 1 && pattern.validEndingTokens.length > 0){
                
            }
        }
        
        return result;
    }
    
    
}


/**
 * Class representing a pattern with arity and valid token information.
 *
 * This class is designed to store and manage information about a specific pattern,
 * including the token it represents, the arity of the pattern, and the tokens that
 * are valid as starting, middle, and ending points in the pattern.
 */
class Pattern{
    constructor() {
        this.representedToken = null;
        this.patternArity = null;
        this.validStartingTokens = null;
        this.validMiddleTokens = null;
        this.validEndingTokens = null;
    }
}

const BuildPattern = function(representedTokenID, patternSequence) {
    const pattern = new Pattern();
    
    pattern.representedTokenID = representedTokenID;
    
    const sequenceLength = patternSequence.length;
    
    pattern.patternArity = patternArity;
    pattern.validStartingTokens = validStartingTokens;
    pattern.validMiddleTokens = validMiddleTokens;
    pattern.validEndingTokens = validEndingTokens;
    
    return pattern;
}


/**
 * Represents a collection of patterns.
 *
 * The `PatternSet` class manages and organizes a set of patterns,
 * allowing operations and interactions on the provided collection of patterns.
 * 
 * @param {Array<Pattern>} patterns - A given set of patterns.
 */
class PatternSet{

    /**
     * @param {Array<Pattern>} patterns - A given set of patterns.
     */
    constructor(patterns) {
        this.patterns = patterns;
    }
}


/**
 * LoopRunnerResult wraps the outcome of a LoopRunner run.
 */
class LoopRunnerResult {
    /**
     * @param {boolean} success - Indicates if the transformation was successful.
     * @param {Array<Token>} tokenSequence - The final token sequence after processing.
     * @param {string|null} errorMessage - An error message if the process failed; otherwise null.
     */
    constructor(success, tokenSequence, errorMessage = null) {
        this.success = success;
        this.tokenSequence = tokenSequence;
        this.errorMessage = errorMessage;
    }
}

/**
 * The LoopRunner class executes pattern matching and token transformations
 * using an ordered set of patterns until a valid end state is reached.
 */
class LoopRunner {
    /**
     * @param {PatternSet} patternSet - An object containing an ordered array of patterns.
     * @param {Array<Token>} tokenSequence - The initial sequence of tokens.
     * @param {PatternSet} validTokenPatterns - A set of patterns defining a valid final token state.
     */
    constructor(patternSet, tokenSequence, validTokenPatterns) {
        this.patternSet = patternSet;
        this.originalTokenSequence = tokenSequence;
        // Make a shallow copy so the original token sequence remains unchanged.
        this.transformedTokenSequence = tokenSequence.slice();
        this.validTokenPatterns = validTokenPatterns;
    }

    /**
     * Runs the transformation process.
     *
     * Process:
     * 1. Iterate over the patterns in patternSet.
     * 2. For each pattern, attempt to find a match in transformedTokenSequence.
     * 3. If a match is found, replace the matched tokens with new tokens from getReplacement,
     *    then restart pattern matching from the beginning.
     * 4. Loop until no patterns produce a match.
     * 5. Check if the final token sequence matches any valid pattern.
     *    If yes, return a success result; if not, return a failure result.
     *
     * @returns {LoopRunnerResult} The result of the transformation process.
     */
    run() {
        let iterations = 0;
        const maxIterations = 1000; // safeguard to prevent infinite loops
        let matchFound = false;

        do {
            matchFound = false;
            // Loop over the ordered patterns.
            for (const pattern of this.patternSet.patterns) {
                const match = pattern.match(this.transformedTokenSequence);
                if (match) {
                    
                    // Get replacement tokens for the matched segment.
                    const replacementTokens = pattern.getReplacement(match);
                    
                    // Reconstruct the token sequence.
                    const before = this.transformedTokenSequence.slice(0, match.start);
                    const after = this.transformedTokenSequence.slice(match.end);
                    this.transformedTokenSequence = before.concat(replacementTokens, after);
                    
                    matchFound = true;
                    
                    // Restart matching from the first pattern.
                    break;
                }
            }

            // After processing, check if the final token sequence matches any valid pattern.
            for (const validPattern of this.validTokenPatterns.patterns) {
                if (validPattern.match(this.transformedTokenSequence)) {
                    return new LoopRunnerResult(true, this.transformedTokenSequence, null);
                }
            }

            iterations++;
            if (iterations > maxIterations) {
                return new LoopRunnerResult(
                    false,
                    this.transformedTokenSequence,
                    "Maximum iterations exceeded. Possible infinite loop."
                );
            }
            
        } while (matchFound);

        

        // If no valid pattern is found, return a failure result.
        return new LoopRunnerResult(
            false,
            this.transformedTokenSequence,
            "Transformation failed: final token sequence does not match any valid pattern."
        );
    }
}


/**
 * @param {Array<Token>} tokenSequence - The initial sequence of tokens.
 * @param {Token} token - A set of patterns defining a valid final token state.
 */
const dropToken = function(tokenSequence, token) {
    return tokenSequence.filter(t => t.tokenID !== token.tokenID);
}

class Or{
    constructor(tokenList) {
        this.tokenList = tokenList;
    }
}

class And{
    constructor(tokenList) {
        this.tokenList = tokenList;
    }
}

class Not{
    constructor(tokenList) {
        this.tokenList = tokenList;
    }
    
}

class OneOrMore{
    constructor(tokenList) {
        this.tokenList = tokenList;
    }
}

const Keywords = {
    "OrKeyword": "Or",
    "AndKeyword": "And",
    "NotKeyword": "Not",
    "ZeroOrMoreKeyword": "ZeroOrMore",
    "OneOrMoreKeyword": "OneOrMore",
    "ZeroOrOneKeyword": "ZeroOrOne",
    "LessOrEqualsKeyword": "LessOrEquals",
    "GreaterOrEqualsKeyword": "GreaterOrEquals",
    "FirstKeyword": "First",
    "LastKeyword": "Last",
}

const Definitions = {
    "OrKeyword": ["UpperO","LowerR"]
};


