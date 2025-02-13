

const ruleModality = {
    uniModal: "uniModal",
    biModal: "biModal",
    triModal: "triModal",
    nModal: "nModal",
}

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
    return tokenB.ancestors.some(ancestor => tokenA.tid === ancestor.tid)
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
    return tokenA.tid === tokenB.tid;
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


class Token{
    constructor(tid) {
        this.tid = type;
        this.value = value;
        this.composition = [];
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

