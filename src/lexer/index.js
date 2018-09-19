export default function* Lexer(characters, buffer = new TextBuffer, nested = false) {
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
