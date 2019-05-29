import Parselet from "./Parselet.js";
import { parseExpression } from "./expressionParser";
import { match, ensure, parseParameters } from "./parserutil.js";
import { notImplemented, unexpectedToken } from "./error.js";
import { parseBlock, parseFunction, parseAsync, parseClass } from "./Statements.js";

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
        return parseAsync(tokens);
    }
}

class CompleteTemplateLiteralParselet extends Parselet {
    parse (tokens) {
        const token = tokens.consume();

        return {
            type: "templateliteral",
            chunks: [ token.value ]
        };
    }
}

class TemplateLiteralParselet extends Parselet {
    parse (tokens) {
        const first = tokens.consume();
        const chunks = [ first.value ];

        while (true) {
            const expr = parseExpression(tokens, 0);
            const next = tokens.consume();

            if (next.type === "templateliteralend") {
                chunks.push(expr, next.value);
                break;
            }
            else if (next.type === "templateliteralchunk") {
                chunks.push(expr, next.value);
            }
            else {
                throw new Error("Expected continuation of template literal");
            }
        } 

        return {
            type: "templateliteral",
            chunks
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

        for (let token of tokens) {
            let { type, value } = token;

            const prop = {
                name: null, 
                prefix: null,
                value: null
            };

            if (type === "symbol" && value === "}") {
                tokens.back();
                break; // no content, early exit
            }
            
            if (type === "identifier" && (value === "get" || value === "set" || value === "async")) {
                if (!(match(tokens, ":") || match(tokens, "("))) {
                    token = tokens.consume();
                    prop.prefix = value;
                    value = token.value;
                    type = token.type;
                }
                else
                    tokens.back(); // unconsume above match!
            }
            
            if (type === "string" || type === "number" || type === "identifier") {
                prop.name = value;
            }
            else if (type === "symbol" && value === "[") {
                prop.name = parseExpression(tokens, 0);
                ensure(tokens, "]");
            }
            else
                unexpectedToken(token);

            properties.push(prop);

            if (match(tokens, "(")) {
                tokens.back();
                const params = parseParameters(tokens);
                const body = parseBlock(tokens);
                prop.value = {
                    type: "function",
                    params,
                    body
                };
            }
            else if (match(tokens, ":")) {
                const body = parseExpression(tokens, 1);
                prop.value = body;
            }
            
            
            if (match(tokens, "}")) {
                tokens.back();
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
    parse(tokens) {
        return parseFunction(tokens);
    }
}

class ClassParselet extends Parselet {
    parse(tokens) {
        return parseClass(tokens);
    }
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
register("templateliteralstart", new TemplateLiteralParselet);
register("templateliteralcomplete", new CompleteTemplateLiteralParselet);
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