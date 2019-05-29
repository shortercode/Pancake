import { statementParsers, parseExpressionStatement } from "./Statements.js";
import { unexpectedToken, unexpectedEnd } from "./error.js";
import { parseExpression } from "./expressionParser.js";
import { ensure, getIdentifier } from "./parserutil.js";

function getStatement(tokens) {
    const token = tokens.peek();

    if (!token)
        unexpectedEnd();

    const parser = statementParsers.get(token.value);

    if (!parser)
        return parseExpressionStatement;

    return parser;
}

function parseLabelStatement (tokens) {
    const name = getIdentifier(tokens);
    ensure(tokens, ":");
    const statement = parseStatement(tokens);
    return {
        type: "label",
        name,
        statement
    };
}

function parseStatement (tokens) {
    const current = tokens.peek();
    const next = tokens.peekNext();

    if (!current)
        unexpectedEnd();

    if (current.type === "identifier" && next && next.value === ":")
        return parseLabelStatement(tokens);

    const parser = getStatement(tokens);

    if (!parser)
        unexpectedToken(tokens.peek());

    return parser(tokens);
}

function* parseProgram (tokens) {
    while (!tokens.done()) {
        yield parseStatement(tokens);
    }
}

export { parseExpression, parseStatement, parseProgram };