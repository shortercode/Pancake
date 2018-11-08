import { parseExpression } from "./expressionParser";
import { ensure, match } from "./parserutil.js";
import { notImplemented, unexpectedToken } from "./error.js";
import { parseStatement } from "./Parser.js";

const statementParsers = new Map;

function endStatement (tokens) {
    const token = tokens.consume();

    if (!token) // end of input - thats fine
        return;

    if (token.type === "symbol" && token.value === ";") // semicolon end - all good
        return;

    tokens.back();
    
    if (token.newline) // for newline detection
        return;

    unexpectedToken(token, ";");
}

function parseExpressionStatement (tokens) {
    const expression = parseExpression(tokens, 0);
    endStatement(tokens);

    return {
        type: "expression",
        expression
    };
}

function parseVariableStatement (tokens) {
    const type = getIdentifier(tokens);
    const list = [];

    while (!tokens.done()) {

        const name = getIdentifier(tokens);
        let initialiser = null;

        if (match(tokens, "="))
            initialiser = parseExpression(tokens, 0);
        
        list.push({
            name,
            initialiser
        });
    }

    endStatement(tokens);

    return {
        type,
        list
    };
}

function parseBlock (tokens) {
    const statements = [];

    ensure(tokens, "{");

    while (!tokens.done()) {
        if (match(tokens, "}"))
            break;
        statements.push(parseStatement(tokens));
    }

    return {
        type: "block",
        statements
    };
}

function parseSimple (tokens, keyword) {
    ensure(tokens, keyword, "identifier");
    const statement = parseExpressionStatement(tokens);
    statement.type = keyword;

    return statement;
}

function parseReturnStatement (tokens) {
    return parseSimple(tokens, "return");
}

function parseThrowStatement (tokens) {
    return parseSimple(tokens, "throw");
}

function parseDebuggerStatement (tokens) {
    ensure(tokens, "debugger", "identifier");
    endStatement(tokens);
    return { type: "debugger "};
}

function parseEmptyStatement (tokens) {
    ensure(tokens, ";");
    return { type: "empty" };
}

function parseFlow (tokens) {
    const type = getIdentifier(tokens);
    const next = tokens.consume();
    let label = null;

    if (!next) unexpectedEnd();

    if (next.newline == false && next.type == "identifier")
        label = next.value;
    
    endStatement(tokens);

    return {
        type,
        label
    };
}

function parseTryStatement (tokens) {
    ensure(tokens, "try", "identifier");

    const statement = {
        type: "try",
        try: null,
        params: null,
        catch: null,
        finally: null
    };

    statement.try = parseBlock(tokens);

    let hasFailureBlock = false;

    if (match(tokens, "catch", "identifier")) {
        statement.params = parseParameters(tokens);
        statement.catch = parseBlock(tokens);
        hasFailureBlock = true;
    }

    if (match(tokens, "finally", "identifier")) {
        statement.finally = parseBlock(tokens);
        hasFailureBlock = true;
    }

    if (!hasFailureBlock)
        unexpectedToken(tokens.peek(), "catch or finally after try");

    return statement;
}

function parseParameters (tokens) {
    const list = [];

    ensure(tokens, "(");
    while (!tokens.done()) {
        const exp = parseExpression(tokens, 1);
        list.push(exp);
        if (!match(tokens, ","))
            break;
    }
    ensure(tokens, ")");

    return list;
}

function parseConditional (tokens) {
    const conditional = {
        condition: null,
        thenStatement: null,
        elseStatement: null
    };
    ensure(tokens, "if", "identifier");
    ensure(tokens, "(");
    conditional.condition = parseExpression(tokens, 0);
    ensure(tokens, ")");

    if (match(tokens, "{")) {
        tokens.back();
        conditional.thenStatement = parseBlock(tokens);
    }
    else
        conditional.thenStatement = parseExpressionStatement(tokens);

    if (match(tokens, "else", "identifier")) {
        if (match(tokens, "if", "identifier")) {
            tokens.back();
            conditional.elseStatement = parseConditional(tokens);
        }
        else if (match(tokens, "{")) {
            tokens.back();
            conditional.elseStatement = parseBlock(tokens);
        }
        else {
            conditional.elseStatement = parseExpressionStatement(tokens);
        }
    }

    return conditional;
}

function parseForLoop (tokens) {

}

function parseWhileLoop (tokens) {

}



function register (value, fn) {
    statementParsers.set(value, fn);
}

register("let", parseVariableStatement);
register("const", parseVariableStatement);
register("var", parseVariableStatement);

register("break", parseFlow);
register("continue", parseFlow);

register("return", parseReturnStatement);
register("throw", parseThrowStatement);
register("debugger", parseDebuggerStatement);

register("{", parseBlock);
register(";", parseEmptyStatement);

register("try", parseTryStatement);


register("if", parseConditional);
register("switch", notImplemented);


register("function", notImplemented);
register("async", notImplemented);
register("class", notImplemented);
register("do", notImplemented);
register("for", notImplemented);
register("while", notImplemented);

register("import", notImplemented);
register("export", notImplemented);
register("label", notImplemented);
register("with", notImplemented);

export { statementParsers, parseExpressionStatement };