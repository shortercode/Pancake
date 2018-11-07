import { statementParsers, parseExpressionStatement } from "./Statements.js";
import { unexpectedToken, unexpectedEnd } from "./error.js";
import { parseExpression } from "./expressionParser.js";

function getStatement(tokens) {
    const token = tokens.peek();

    if (!token)
        unexpectedEnd();

    const parser = statementParsers.get(token.value);

    if (!parser)
        return parseExpressionStatement;

    return parser;
}

function parseStatement (tokens) {
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