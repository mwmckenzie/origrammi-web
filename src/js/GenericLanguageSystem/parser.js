
let CharMapper = GetTokenName;



/**
 * Converts a string of characters into a map of tokens where each character is matched to a corresponding token.
 * Any characters that cannot be mapped to a token result in an error being logged.
 *
 * @param {string} rawText The input string to be lexically analyzed and converted into token maps.
 * @return {Array|Array<TokenMap>} Returns an array of token mappings if successful. If there are unrecognized characters, an array of error messages is returned instead.
 */
function LexCharsToTokenMaps (rawText) {
    
    const tokenMaps  = [];
    const errors = [];
    
    for (let i = 0; i < rawText.length; i++) {

        if (errors.length > 0){
            console.log("Lex Chars Failed. Error Message: " + errors[0]);
            return errors;
        }
        
        const char = rawText.charAt(i);
        const token = GetCharTokenMap(char);
        
        if (token){
            tokenMaps.push(token)
        } else{
            errors.push("Lexing Error at Char Pos " + i + " | Unknown character: " + char);
        }
    }
    
    console.log("Lex Chars Succeeded. Token Names: " + tokenMaps);
    
    return tokenMaps;
}

function parseText (rule) {
    var depth = 0;
    var inTag = false;
    var sections = [];
    var escaped = false;

    sections.errors = [];
    var start = 0;

    var escapedSubstring = "";
    var lastEscapedChar = undefined;

    function createSection(start, end, type) {

        if (end - start < 1) {
            sections.errors.push(start + ": 0-length section of type " + type);
        }

        var rawSubstring;

        if (lastEscapedChar !== undefined) {
            rawSubstring = escapedSubstring + rule.substring(lastEscapedChar + 1, end);
        } else {
            rawSubstring = rule.substring(start, end);
        }

        sections.push({
            type: type,
            raw: rawSubstring
        });

        lastEscapedChar = undefined;
        escapedSubstring = "";
    }

    for (var i = 0; i < rule.length; i++) {

        if (!escaped) {
            var c = rule.charAt(i);

            switch (c) {

                // Enter a deeper bracketed section
                case '[':
                    if (depth === 0 && !inTag) {
                        if (start < i)
                            createSection(start, i, 0);
                        start = i + 1;
                    }
                    depth++;
                    break;
                case ']':
                    depth--;

                    // End a bracketed section
                    if (depth === 0 && !inTag) {
                        createSection(start, i, 2);
                        start = i + 1;

                    }
                    break;

                // Hashtag
                //   ignore if not at depth 0, that means we are in a bracket
                case '#':
                    if (depth === 0) {
                        if (inTag) {
                            createSection(start, i, 1);
                            start = i + 1;
                        } else {
                            if (start < i)
                                createSection(start, i, 0);
                            start = i + 1;
                        }
                        inTag = !inTag;
                    }
                    break;

                case '\\':
                    escaped = true;
                    escapedSubstring = escapedSubstring + rule.substring(start, i);
                    start = i + 1;
                    lastEscapedChar = i;
                    break;
            }
        } else {
            escaped = false;
        }
    }
    if (start < rule.length)
        createSection(start, rule.length, 0);

    if (inTag) {
        sections.errors.push("Unclosed tag");
    }
    if (depth > 0) {
        sections.errors.push("Too many [");
    }
    if (depth < 0) {
        sections.errors.push("Too many ]");
    }

    return sections;
}


function parseTokens (rule) {
    var depth = 0;
    var inTag = false;
    var sections = [];
    var escaped = false;

    sections.errors = [];
    var start = 0;

    var escapedSubstring = "";
    var lastEscapedChar = undefined;

    function createSection(start, end, type) {

        if (end - start < 1) {
            sections.errors.push(start + ": 0-length section of type " + type);
        }

        var rawSubstring;

        if (lastEscapedChar !== undefined) {
            rawSubstring = escapedSubstring + rule.substring(lastEscapedChar + 1, end);
        } else {
            rawSubstring = rule.substring(start, end);
        }

        sections.push({
            type: type,
            raw: rawSubstring
        });

        lastEscapedChar = undefined;
        escapedSubstring = "";
    }

    for (var i = 0; i < rule.length; i++) {

        if (!escaped) {
            var c = rule.charAt(i);

            switch (c) {

                // Enter a deeper bracketed section
                case '[':
                    if (depth === 0 && !inTag) {
                        if (start < i)
                            createSection(start, i, 0);
                        start = i + 1;
                    }
                    depth++;
                    break;
                case ']':
                    depth--;

                    // End a bracketed section
                    if (depth === 0 && !inTag) {
                        createSection(start, i, 2);
                        start = i + 1;

                    }
                    break;

                // Hashtag
                //   ignore if not at depth 0, that means we are in a bracket
                case '#':
                    if (depth === 0) {
                        if (inTag) {
                            createSection(start, i, 1);
                            start = i + 1;
                        } else {
                            if (start < i)
                                createSection(start, i, 0);
                            start = i + 1;
                        }
                        inTag = !inTag;
                    }
                    break;

                case '\\':
                    escaped = true;
                    escapedSubstring = escapedSubstring + rule.substring(start, i);
                    start = i + 1;
                    lastEscapedChar = i;
                    break;
            }
        } else {
            escaped = false;
        }
    }
    if (start < rule.length)
        createSection(start, rule.length, 0);

    if (inTag) {
        sections.errors.push("Unclosed tag");
    }
    if (depth > 0) {
        sections.errors.push("Too many [");
    }
    if (depth < 0) {
        sections.errors.push("Too many ]");
    }

    return sections;
}