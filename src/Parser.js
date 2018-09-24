import BufferedIterator from "./BuffererIterator";

const statementParselets = new Map;
const infixParselets = new Map;
const prefixParselets = new Map;
const infixPrecedence = new Map;

statementParselets.set("var", t => parseVariable("var", t));
statementParselets.set("let", t => parseVariable("let", t));
statementParselets.set("const", t => parseVariable("const", t));
statementParselets.set("class", parseClass);
statementParselets.set("{", parseBlock);

function getPrecedence(tokens) {
    const token = tokens.peek();
    return infixPrecedence.get(token.type);
}

function parseExpression(tokens, precedence = 0) {
    const token = tokens.peek();
    let parselet = prefixParselets.get(token.value); // mostly right, doesn't work for identifiers
    let left;

    if (parselet)
        left = parselet(tokens);
    else
        throw new Error(`Could not parse "${token.value}".`);
    
    // TODO this loop could probably be better
    while (precedence < getPrecedence(tokens)) {
        const token = tokens.next().value;
        const parselet = infixParselets.get(token.value);

        if (parselet)
            left = parselet(left, tokens);
        else
            throw new Error(`Could not parse "${token.value}".`); // maybe consider end of expression instead?
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