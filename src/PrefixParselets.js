import Parselet from "./Parselet.js";
import { parseExpression } from "./expressionParser";
import { match, ensure } from "./parserutil.js";
import { notImplemented, unexpectedToken } from "./error.js";

const prefixParselets = new Map;
const identifierPrefixParselets = new Map;

function register (symbol, parselet) {
    prefixParselets.set(symbol, parselet);
}

function registerKeyword (word, parselet) {
    identifierPrefixParselets.set(word, parselet);
}

class PrefixOperatorParselet extends Parselet {
    parse (tokens) {
        const operator = tokens.consume();
        const expression = parseExpression(tokens, this.precedence);

        return {
            type: "prefix-operator",
            operator,
            expression
        };
    }
}

class AsyncParselet extends Parselet {
    parse (tokens) {
        const operator = tokens.consume();
        const expression = parseExpression(tokens, this.precedence);

        // TODO expression must be function or arrow function

        return {
            type: "async-operator",
            operator,
            expression
        };
    }
}

class NameParselet extends Parselet {
    parse (tokens) {
        const token = tokens.consume();

        return {
            type: "identifier",
            value: token.value
        };
    }
}

class StringParselet extends Parselet {
    parse (tokens) {
        const token = tokens.consume();

        return {
            type: "string",
            value: token.value
        };
    }
}

class NumberParselet extends Parselet {
    parse (tokens) {
        const token = tokens.consume();

        return {
            type: "number",
            value: token.value
        };
    }
}

class RegexParselet extends Parselet {
    parse (tokens) {
        const token = tokens.consume();

        return {
            type: "regex",
            value: token.value
        };
    }
}

class ArrayParselet extends Parselet {
    parse (tokens) {
        match(tokens, "[");
        let expressions = [];

        for (const { value, type } of tokens) {
            if (type === "symbol" && value === "]") {
                tokens.back();
                break;
            }
            else if (type === "symbol" && value === ",")
                expressions.push(null);
            else {
                tokens.back();
                expressions.push(parseExpression(tokens, 1));
            }
        }

        match(tokens, "]");

        // the same as allowing a comma at the end with no effect
        if (expressions[expressions.length - 1] === null)
            expressions.pop();

        return {
            type: "array",
            expressions
        };
    }
}

class ObjectParselet extends Parselet {
    parse (tokens) {
        ensure(tokens, "{");
        let properties = [];

        for (const token of tokens) {
            let { type, value } = token;

            const prop = {
                name: null, 
                prefix: null,
                value: null
            };

            if (type === "symbol" && value === "}") {
                break; // no content, early exit
            }
            else if (type === "identifier") {
                if (value === "get" || value === "set" || value === "async") {
                    const next = tokens.peek();
                    if (next.type === "identifier") {
                        tokens.consume();
                        prop.prefix = value;
                        value = next.value;
                    }
                }
                prop.name = value;
            }
            else if (type === "string") {
                prop.name = value;
            }
            else if (type === "symbol" && value === "[") {
                prop.name = parseExpression(tokens, 0);
                ensure(tokens, "]");
                expressions.push(null);
            }
            else
                unexpectedToken(token);

            properties.push(prop);

            if (match(tokens, "(")) {
                const params = parseParameters(tokens);
                ensure(tokens, ")");
                const body = parseBlock(tokens);
                prop.value = {
                    type: "function",
                    params,
                    body
                };
            }
            else if (match(tokens, ":")) {
                const body = parseExpression(tokens, 0);
                prop.value = body;
            }
            
            
            if (match(tokens, "}")) {
                break;
            }
            else if (!match(tokens, ","))
                unexpectedToken(tokens.peek());   
        }

        ensure(tokens, "}");

        return {
            type: "object",
            properties
        };
    }
}

class FunctionParselet extends Parselet {
    // pipe back to common function parser?
}

class ClassParselet extends Parselet {
    // pipe back to common class parser?
}

class ImportParselet extends Parselet {
    // can be either import.meta or import(expression)
}

class GroupParselet extends Parselet {
    parse (tokens) {
        match(tokens, "(");
        const expression = parseExpression(tokens, 0);
        match(tokens, ")");

        return expression;
    }
}

register("!", new PrefixOperatorParselet);
register("+", new PrefixOperatorParselet);
register("-", new PrefixOperatorParselet);
register("++", new PrefixOperatorParselet);
register("--", new PrefixOperatorParselet);
register("~", new PrefixOperatorParselet);
register("...", new PrefixOperatorParselet);

register("identifier", new NameParselet);
register("number", new NumberParselet);
register("regex", new RegexParselet);
register("string", new StringParselet);
// TODO template literal
register("[", new ArrayParselet);
register("{", new ObjectParselet);
register("(", new GroupParselet(20));
registerKeyword("async", new AsyncParselet);
registerKeyword("import", new ImportParselet);
registerKeyword("function", new FunctionParselet);
registerKeyword("class", new ClassParselet);

registerKeyword("new", new PrefixOperatorParselet);
registerKeyword("await", new PrefixOperatorParselet);
registerKeyword("typeof", new PrefixOperatorParselet);
registerKeyword("void", new PrefixOperatorParselet);
registerKeyword("delete", new PrefixOperatorParselet);

// maybe special behaviour for this on to also parse "yield*"
registerKeyword("yield", new PrefixOperatorParselet);

export { prefixParselets, identifierPrefixParselets };