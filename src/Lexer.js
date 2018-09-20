import Trie from "./Trie.js";
import TextBuffer from "./TextBuffer.js";

const STAR = "*";
const QUOTE = "\"";
const SINGLE_QUOTE = "\'";
const TEMP_QUOTE = "\`";
const DOLLAR = "$";
const L_BRACE = "{";
const R_BRACE = "}";
const PERIOD = ".";
const BACKSLASH = "\\";
const SLASH = "/";
const NEWLINE = "\n";

const SYMBOLS = createOperatorList([
    "( ) [ ] { }",
    ". , ; ...",
    "- + ++ --",
    "* ** / %",
    "<< >> >>>",
    "< <= > >=",
    "== != === !==",
    "& ^ | ! ~",
    "&& ||",
    "? :",
    "= += -= *= /= %= **= <<= >>= >>>= &= ^= |="
]);

const REGEX_SAFE_SYMBOLS = new Set(
    "( [ { , ; ... - + ++ -- * ** / % << >> >>> < > <= >= == != === !== & ^ | ! ~ && || ? : = += -= *= /= %= **= <<= >>= >>>= &= ^= |=".split(" ")
);

function createOperatorList(types) {
    const root = new Trie;
    for (const list of types) {
        for (const sym of list.split(" ")) {
            root.insert(sym);
        }
    }
    return root;
}

function isLetter(ch) {
    return /^\w$/.test(ch);
}

function isNumber(ch) {
    return /^\d$/.test(ch);
}

function isSymbol(ch) {
    return SYMBOLS.has(ch);
}

function isWhitespace(ch) {
    return /^\s$/.test(ch);
}

function regexTest(token) {
    if (!token)
        return true;

    const {
        type,
        value
    } = token;

    if (type === "symbol")
        return REGEX_SAFE_SYMBOLS.has(value);

    return false;
}

function* lexTemplateliteral(characters, buffer) {
    let position = characters.position();
    characters.next(); // consume backtick

    for (const ch of characters) {
        if (ch === DOLLAR && characters.peek() === L_BRACE) {
            characters.next(); // consume opening brace

            const string = buffer.consume();
            yield {
                type: "templateliteral",
                position,
                value: string
            };

            yield* lexer(characters, buffer, true);

            position = characters.position();
            characters.next(); // consume closing brace
        } else if (ch === TEMP_QUOTE) {
            const string = buffer.consume();
            yield {
                type: "templateliteral",
                position,
                value: string
            };
            return;
        } else {
            buffer.push(ch);
        }
    }
}

function lexIdentifier(characters, buffer) {
    const pos = characters.position();
    for (const ch of characters) {
        if (!isLetter(ch)) {
            const identifier = buffer.consume();
            characters.back();
            return {
                type: "identifier",
                position: pos,
                value: identifier
            };
        } else {
            buffer.push(ch);
        }
    }
}

function lexNumber(characters, buffer) {
    const pos = characters.position();
    for (const ch of characters) {
        if (ch == PERIOD) {
            push(ch);
            break;
        } else if (!isNumber(ch)) {
            const number = buffer.consume();
            return {
                type: "number",
                position: pos,
                value: number
            };
        } else {
            buffer.push(ch);
        }
    }

    for (const ch of characters) {
        if (!isNumber(ch)) {
            const number = buffer.consume();
            return {
                type: "number",
                position: pos,
                value: number
            };
        } else {
            buffer.push(ch);
        }
    }
}

function lexString(characters, delimiter, buffer) {
    const pos = characters.position();
    characters.next(); // consume quote mark
    let isTextEscaped = false;

    for (const ch of characters) {
        if (ch != delimiter || isTextEscaped == true) {
            if (isTextEscaped) {
                isTextEscaped = false;
                buffer.push(ch);
            } else {
                if (ch == BACKSLASH)
                    isTextEscaped = true;
                else
                    buffer.push(ch);
            }
        } else {
            const string = buffer.consume();
            return {
                type: "string",
                position: pos,
                value: string
            };
        }
    }
}

function lexSymbol(characters, buffer, regexAllowed) {
    const pos = characters.position();
    let symbolTrie = SYMBOLS;

    const first = characters.peek();

    if (first === SLASH) {
        const next = characters.peekNext();

        if (next === STAR)
            return lexLongcomment(characters, buffer, pos);
        else if (next === SLASH)
            return lexShortcomment(characters, buffer, pos);
        else if (regexAllowed) // depends on context
            return lexRegex(characters, buffer, pos);
    }

    for (const ch of characters) {
        const next = symbolTrie.get(ch);

        if (!next) {
            const value = symbolTrie.value;
            if (!value)
                throw new Error("Unexpected character");

            characters.back();

            return {
                type: "symbol",
                position: pos,
                value
            };
        } else
            symbolTrie = next;
    }
}

function lexLongcomment(characters, buffer, position) {
    characters.next();
    characters.next();
    for (const ch of characters) {
        if (ch === STAR && characters.peek() === SLASH) {
            characters.next(); // consume slash
            // optional comment token here?
            return;
        }
    }
}

function lexShortcomment(characters, buffer, position) {
    characters.next();
    characters.next();
    for (const ch of characters) {
        if (ch === NEWLINE) {
            // optional comment token here?
            return;
        }
    }
}

function lexRegex(characters, buffer, position) {
    let charset = false;
    let escaped = false;

    buffer.push(characters.next().value);

    for (const ch of characters) {
        // newline not allowed
        if (ch === NEWLINE)
            throw new Error("unterminated regex");

        if (escaped) {
            escaped = false;
        } else if (ch === BACKSLASH) {
            escaped = true;
        } else if (charset) {
            if (ch === "]") charset = false;
        } else if (ch === "[")
            charset = true;
        else if (ch === "/") {
            buffer.push(ch);
            break;
        }

        buffer.push(ch);
    }

    for (const ch of characters) {
        if (!isLetter(ch)) {
            characters.back();
            break;
        } else {
            buffer.push(ch);
        }
    }

    const statement = buffer.consume();

    return {
        type: "regex",
        position,
        value: statement
    };
}

function* lexer(characters, buffer = new TextBuffer, nested = false) {
    const stack = [];
    let previousToken = null;

    for (const ch of characters) {
        let token = null;
        if (isLetter(ch)) {
            characters.back();
            token = lexIdentifier(characters, buffer);
        } else if (isNumber(ch)) {
            characters.back();
            token = lexNumber(characters, buffer);
        } else if (ch == QUOTE || ch == SINGLE_QUOTE) {
            characters.back();
            token = lexString(characters, ch, buffer);
        } else if (ch === TEMP_QUOTE) {
            characters.back();

            const tokenIterator = lexTemplateliteral(characters, buffer);

            // important that we keep track of the last token
            for (const t of tokenIterator) {
                token = t;
                yield t;
            }
        } else if (isSymbol(ch)) {
            characters.back();
            const regexAllowed = ch === SLASH && regexTest(token);
            token = lexSymbol(characters, buffer, regexAllowed);
        } else if (!isWhitespace(ch)) {
            throw new Error(`Unknown character ${ch}`);
        }

        // track bracket stack here, allows extra verification
        // and aids template literals expression lexing

        if (token && token.type === "symbol") {
            switch (token.value) {
                case "{":
                case "[":
                case "(":
                    stack.push(token);
                    break;
                case "}":
                case "]":
                case ")":
                    const prev = stack.pop();

                    if (!prev) {
                        if (nested) {
                            // special case for template literals
                            // an unmatched brace indicates the end
                            // of the expression, so return
                            if (token.value != "}")
                                throw new Error("unmatched bracket");
                            else {
                                characters.back(); // push the brace back
                                return;
                            }
                        }

                        throw new Error("unmatched bracket");
                    }

                    if (prev.value === "(" && ")" != token.value)
                        throw new Error("mismatched bracket");
                    if (prev.value === "[" && "]" != token.value)
                        throw new Error("mismatched bracket");
                    if (prev.value === "{" && "}" != token.value)
                        throw new Error("mismatched bracket");
                    break;
            }
        }

        previousToken = token;

        if (token)
            yield token;
    }
}

export default lexer;
