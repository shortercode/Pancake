import { parseExpression } from "./expressionParser";
import { ensure, match, parseParameters, getIdentifier } from "./parserutil.js";
import { notImplemented, unexpectedToken, unexpectedEnd } from "./error.js";
import { parseStatement } from "./Parser.js";

const statementParsers = new Map;

function endStatement (tokens) {
    const token = tokens.consume();

    if (!token) // end of input - thats fine
        return;

    if (token.type === "symbol" && token.value === ";") // semicolon end - all good
        return;

    tokens.back();

    if (token.type === "symbol" && token.value === "}") // end of block - all good
        return;
    
    if (token.isNewline) // for newline detection
        return;

    unexpectedToken(token, ";");
}

function shouldEndStatement (tokens) {
    const token = tokens.peek();

    if (!token) // end of input - thats fine
        return true;

    if (token.type === "symbol" && token.value === ";") // semicolon end - all good
        return true;

    if (token.type === "symbol" && token.value === "}") // end of block - all good
        return true;
    
    if (token.isNewline) // for newline detection
        return true;

    return false;
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

        const name = parseExpression(tokens, 4); // higher precedence than assignment
        let initialiser = null;

        if (match(tokens, "="))
            initialiser = parseExpression(tokens, 4);

        list.push({
            name,
            initialiser
        });

        if (!match(tokens, ","))
            break;
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

    while (true) {
        if (match(tokens, "}"))
            break;
        statements.push(parseStatement(tokens));
    }

    return {
        type: "block",
        statements
    };
}

function parseFunction (tokens) {
    ensure(tokens, "function", "identifier");

    const next = tokens.peek();
    let name = null;
    
    if (!next)
        unexpectedEnd();

    if (next.type === "identifier")
        name = getIdentifier(tokens);

    const parameters = parseParameters(tokens);
    const block = parseBlock(tokens);

    return {
        type: "function",
        name,
        parameters,
        block
    };
}

function parseClass (tokens) {
    ensure(tokens, "class", "identifier");
    const name = getIdentifier(tokens);
    let superclass;
    
    if (match(tokens, "extends", "identifier"))
        superclass = parseExpression(tokens, 0);

    ensure(tokens, "{");

    const methods = [];

    do {
        // TODO computed names
        // TODO get/set/static/async

        let name = getIdentifier(tokens);
        let parameters = parseParameters(tokens);
        let body = parseBlock(tokens);

        methods.push({
            name,
            parameters,
            body
        });
    }
    while (!match(tokens, "}"))

    return {
        type: "class",
        name,
        superclass,
        methods
    };
}

function parseSimple (tokens, keyword) {
    ensure(tokens, keyword, "identifier");

    const result = {
        type: keyword,
        statement: null
    };

    if (!shouldEndStatement(tokens))
        result.statement = parseExpressionStatement(tokens);

    endStatement(tokens);

    return result;
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
    const next = tokens.peek();
    let label = null;

    if (next.type == "identifier")
    {
        label = next.value;
        tokens.consume();
    }
    
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

function parseConditional (tokens) {
    const conditional = {
        type: "conditional",
        condition: null,
        thenStatement: null,
        elseStatement: null
    };
    ensure(tokens, "if", "identifier");
    ensure(tokens, "(");
    conditional.condition = parseExpression(tokens, 0);
    ensure(tokens, ")");

    conditional.thenStatement = parseStatement(tokens);

    if (match(tokens, "else", "identifier")) {
        if (match(tokens, "if", "identifier")) {
            tokens.back();
            conditional.elseStatement = parseConditional(tokens);
        }
        else {
            conditional.elseStatement = parseStatement(tokens);
        }
    }

    return conditional;
}

function parseWith (tokens) {
    ensure(tokens, "with", "identifier");
    ensure(tokens, "(");
    const expression = parseExpression(tokens, 0);
    ensure(tokens, ")");
    const block = parseStatement(tokens);

    return {
        type: "with",
        expression,
        block
    }
}

function parseDo (tokens) {
    ensure(tokens, "do", "identifier");

    const block = parseStatement(tokens);

    ensure(tokens, "while", "identifier");

    ensure(tokens, "(");
    const expression = parseExpression(tokens, 0);
    ensure(tokens, ")");

    return {
        type: "do",
        expression,
        block
    }
}

function parseForLoop (tokens) {
    ensure(tokens, "for", "identifier");
    ensure(tokens, "(");
    const pre = parseStatement(tokens);
    let condition = null;
    if (!match(tokens, ";")) {
        condition = parseExpression(tokens, 0);
        ensure(tokens, ";");
    }
    let post = null;

    if (!match(tokens, ")")) {
        post = parseExpression(tokens, 0);
        ensure(tokens, ")");
    }
    
    const block = parseStatement(tokens);

    return {
        type: "for",
        pre,
        condition,
        post,
        block
    };
}

function parseAsync (tokens) {
    ensure(tokens, "async", "identifier");

    const pre = tokens.peek();
    const fn = parseExpression(tokens);

    if (fn.type === "function")
        fn.type = "async-function";
    else if (fn.type === "arrow-function")
        fn.type = "async-arrow-function";
    else
        unexpectedToken(pre, "function or arrow function");
    
    return fn;
}

function parseWhileLoop (tokens) {

    const conditional = {
        type: "while",
        condition: null,
        thenStatement: null
    };

    ensure(tokens, "while", "identifier");
    ensure(tokens, "(");
    conditional.condition = parseExpression(tokens, 0);
    ensure(tokens, ")");

    conditional.thenStatement = parseStatement(tokens);

    return conditional;
}

function parseSwitchStatement (tokens) {

    // wow the classic c style switch statement is a mess...

    ensure(tokens, "switch", "identifier");
    ensure(tokens, "(");
    const test = parseExpression(tokens, 0);
    const cases = [];
    ensure(tokens, ")");
    ensure(tokens, "{");
    
    while (!tokens.done()) {
        let test = null;
        let consequents = [];

        if (match(tokens, "}")) {
            break;
        }
        else if (match(tokens, "case", "identifier")) {
            test = parseExpression(tokens, 0);
            ensure(tokens, ":");
        }
        else if (match(tokens, "default", "identifier")) {
            ensure(tokens, ":");
        }
        else {
            throw new Error("Expected case");
        }

        while (!tokens.done()) {
            const isEnd = match(tokens, "}");
            const isCaseNext = match(tokens, "case", "identifier");
            const isDefaultNext = match(tokens, "default", "identifier");

            if (isEnd) {
                break;
            }
            else if (isCaseNext || isDefaultNext) {
                tokens.back()
                break;
            }

            const consequent = parseStatement(tokens);
            consequents.push(consequent);
        }

        cases.push({
            test,
            consequents
        });
    }

    return {
        type: "switch",
        test,
        cases
    };
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
register("while", parseWhileLoop);
register("with", parseWith);
register("do", parseDo);
register("function", parseFunction);
register("async", parseAsync);
register("for", parseForLoop);
register("class", parseClass);

register("switch", parseSwitchStatement);

register("import", notImplemented);
register("export", notImplemented);


export { statementParsers, parseExpressionStatement, parseBlock, parseFunction, parseAsync, parseClass };