import BufferedIterator from "./BuffererIterator";

const statementParselets = new Map;
const infixParselets = new Map;
const prefixParselets = new Map;
const parseletPrecedence = new Map;

statementParselets.set("var", t => parseVariable("var", t));
statementParselets.set("let", t => parseVariable("let", t));
statementParselets.set("const", t => parseVariable("const", t));
statementParselets.set("class", parseClass);
statementParselets.set("{", parseBlock);
statementParselets.set("function", parseFunction);
statementParselets.set("switch", parseSwitch);
statementParselets.set("import", parseImport);
statementParselets.set("export", parseExport);
statementParselets.set("throw", parseThrow);

function getPrecedence(parselet) {
    return parseletPrecedence.get(parselet);
}

function getParselet (tokens, infix) {
    const next = tokens.peek();
    const { type, value } = next;
    const parselets = infix ? infixParselets : prefixParselets;

    if (!infix) {
        switch (type) {
            case "identifier": return parseIdentifier;
            case "regex": return parseRegex;
            case "number": return parseNumber;
            case "templateliteral": return parseTemplateLiteral;
            case "string": return parseString;
        }
    }

    if (type == "symbol")
        return parselets.get(value);
    if (type == "identifier")
        return parselets.get(value);

    throw new Error("Unknown token type");
}

function parseIdentifier () {
    const name = tokens.next().value;
    switch (name) {
        case "function":
        case "class":
        case "await":
        case "this":
        
    }
}

function parseRegex () {

}

function parseString () {

}

function parseTemplateLiteral () {

}

function parseNumber () {

}

function parseExpression(tokens, precedence = 0) {
    let parselet = getParselet(tokens);
    let left;

    if (parselet)
        left = parselet(tokens);
    else
        throw new Error(`Could not parse "${tokens.peek()}".`);
    
    while (true) {
        const parselet = getParselet(tokens, true);
        if (precedence >= getPrecedence(parselet))
            break;

        if (parselet)
            left = parselet(left, tokens);
        else
            break; // newline and/or semicolon magic needs to happen here
    }

    return left;
}

function getName(tokens) {
    const identifier = tokens.next().value;
    if (!identifier)
        throw new Error("Unexpected end of input");
    if (identifier.type != "identifier")
        throw new Error("Expected identifier");
    return identifier;
}

function parseClass(tokens) {
    
    const name = getName(tokens);
    let inherit;

    if (tokens.peek() === "extends") {
        tokens.next();
        inherit = parseExpression(tokens);
    }

    if (tokens.next().value != "{")
        throw new Error("");

    const body = [];

    for (const token of tokens) {

    }

    return {
        type: "class",
        name: name.value,
        position: name.position,
        inherit,
        body
    };
}

function parseVariable(tokens) {

}

function parseFunction(tokens) {

}

function* parse (tokens) {
    for (const token of tokens) {
        const parselet = token.type === "identifier" && statementParselets.get(token.value);

        if (!parselet) {
            tokens.back();
            yield parseExpression(tokens);
        }
        else
            yield parselet(token);
    }
}

export default function (tokens) {
    const itr = parse(tokens);
    return BufferedIterator(itr);
}