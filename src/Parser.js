import BufferedIterator from "./BuffererIterator";
import { prefixParselets, identifierPrefixParselets } from "./PrefixParselets.js";
import { infixParselets, identifierInfixParselets } from "./PrefixParselets.js";

// util 
function matchSymbol (tokens, symbol) {
    const token = tokens.consume();

    if (token.type !== "symbol" || token.value !== symbol)
        unexpectedToken(token, symbol);
}

function unexpectedToken (token, expected) {
    if (expected)
        throw new Error(`Expected "${expected}" @ "${token.position}"`);
    else
        throw new Error(`Unexpected token "${token.value}" @ "${token.position}"`);
}

// expression parser

function getPrecedence(tokens) {
    const parser = getInfix(tokens);
    return parser ? parser.precedence : 0;
}

function getInfix(tokens) {
    const token = tokens.peek();
    if (!token)
        return null;

    if (token.type === "symbol")
        return infixParselets.get(token.value);

    if (token.type === "identifier") {
        const parselet = identifierInfixParselets.get(token.value);
        if (parselet)
            return parselet;
    }

    return infixParselets.get(token.type);
}

function getPrefix(tokens) {
    const token = tokens.peek();
    if (!token)
        return null;

    if (token.type === "symbol")
        return prefixParselets.get(token.value);

    if (token.type === "identifier") {
        const parselet = identifierPrefixParselets.get(token.value);
        if (parselet)
            return parselet;
    }

    return prefixParselets.get(token.type);
}

function parseExpression (tokens, precedence) {
    let parser = getPrefix(tokens);

    if (!parser)
        unexpectedToken(tokens.peek());

    let left = parser.parse(tokens);

    while (precedence < getPrecedence(tokens)) {
        parser = getInfix(tokens);
        left = parser.parse(tokens, left);
    }

    return left;
}

// statement types

function parseExpressionStatement (tokens) {
    const expression = parseExpression(tokens, 0);
    endStatement(tokens);

    return {
        type: "expression",
        expression
    };
}

function parseVariableStatement (type, tokens) {
    const identifier = tokens.consume();

    if (identifier.type != "identifier")
        unexpectedToken(identifier, "identifier");
    
    matchSymbol(tokens, "=");

    const expression = parseExpression(tokens, 0);

    endStatement(tokens);

    return {
        type,
        identifier,
        expression
    };
}

function parseBlock (tokens) {
    const statements = [];
    while (!tokens.done()) {
        const next = tokens.peek();
        if (next.type == "symbol" && next.value == "}") {
            tokens.consume();
            break;
        }
        statements.push(parseStatement(tokens));
    }

    return {
        type: "block",
        statements
    };
}

function parseReturnStatement (tokens) {
    const statement = parseExpressionStatement(tokens);
    statement.type = "return";

    return statement;
}

function endStatement (tokens) {
    const token = tokens.consume();

    if (!token) // end of input - thats fine
        return;

    if (token.type === "symbol" && token.value === ";") // semicolon end - all good
        return;

    tokens.back();
    
    if (token.newline) // for newline detection
        return;

    throw new Error("Unexpected token " + token.value);
}

// main statement block

function parseStatement (tokens) {
    const token = tokens.consume();

    switch (token.value) {
        case "let":
        case "const":
        case "var":
            return parseVariableStatement(token.value, tokens);
        case "return":
            return parseReturnStatement(tokens);
        case "break":
        case "continue":
        case "{":
            return parseBlock(tokens);
        case "if":
        case "switch":
        case "throw":
        case "try":
        case "function":
        case "async":
        case "class":
        case "do":
        case "for":
        case "while":
        case "debugger":
        case "import":
        case "export":
        case "label":
        case ";": // empty statement
        case "with":
            break;

        default:
            tokens.back(); // unconsume!
            return parseExpressionStatement(tokens);
    }
}

// entry points

function* parseProgram (tokens) {
    while (!tokens.done()) {
        yield parseStatement(tokens);
    }
}

export default function (tokens) {
    const itr = parseProgram(tokens);
    return BufferedIterator(itr);
}

export { parseExpression };