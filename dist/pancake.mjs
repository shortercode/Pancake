class Trie extends Map {
    constructor() {
        super();
        this.result = null;
    }
    find(key) {
        return Trie.find(this, key);
    }
    insert(key, value = key) {
        return Trie.insert(this, key, value);
    }
    static find(root, key) {
        let node = root;
        for (const char of key) {
            node = node.get(char);
            if (!node)
                return null;
        }
        return node.value;
    }
    static insert(root, key, value = key) {
        let node = root;

        for (const char of key) {
            let child = node.get(char);
            if (!child) {
                child = new Trie;
                node.set(char, child);
            }
            node = child;
        }

        node.value = value;
    }
}

const { TextDecoder } = require("util");

class TextBuffer {
    constructor(pageSize = 2048) {
        this._buffer = new Uint16Array(pageSize);
        this._size = pageSize;
        this._pageSize = pageSize;
        this._index = 0;
        this._decoder = new TextDecoder("utf-16");

        // short length
        this._views = {
            single: this._buffer.subarray(0, 1),
            double: this._buffer.subarray(0, 2),
            triple: this._buffer.subarray(0, 3)
        };
    }
    _growBuffer() {
        // increase recorded buffer size
        this._size += this._pageSize;
        // create replacement
        const replacement = new Uint16Array(this._size);
        // copy old buffer into replacement
        replacement.set(this._buffer);
        // switch the buffers
        this._buffer = replacement;
    }
    push(ch) {
        const size = ch.length;

        // if we need more space, increase the buffer size
        if (this._index + size >= this._size)
            this._growBuffer();

        const pos = this._index;

        // copy the character codes to the buffer
        // don't use codePointAt here, we want char codes not code points
        for (let i = 0; i < size; i++)
            this._buffer[pos + i] = ch.charCodeAt(i);

        // increase the index position
        this._index += size;
    }
    consume() {
        if (this._index == 0)
            throw new Error("nothing to consume");

        let subview;

        switch (this._index) {
            case 1:
                subview = this._views.single;
                break;
            case 2:
                subview = this._views.double;
                break;
            case 3:
                subview = this._views.triple;
                break;
            default:
                subview = this._buffer.slice(0, this._index);
                break;
        }

        this._index = 0;
        return this._decoder.decode(subview);
    }
}

/*
    Wrapper for an iterator/generator that has a persistent state and
    buffering to provide 2 value lookahead, 1 value lookbehind and step back
*/

function BufferedIterator (itr) {
    let previous = null;
    let current = itr.next();
    let next = itr.next();
    let future = null;

    return {
        next () {
            previous = current;
            current = next;
            next = future || itr.next();
            future = null;

            return previous;
        },
        consume () {
            return this.next().value;
        },
        done () {
            return current.done;
        },
        back () {
            future = next;
            next = current;
            current = previous;
            previous = null;
            return current;
        },
        previous () {
            return previous ? previous.value : null ;
        },
        peek () {
            return current.value;
        },
        peekNext () {
            return next.value;
        },
        [Symbol.iterator] () {
            return this;
        }
    }
}

const STAR = "*";
const QUOTE = "\"";
const SINGLE_QUOTE = "\'";
const TEMP_QUOTE = "\`";
const DOLLAR = "$";
const L_BRACE = "{";
const PERIOD = ".";
const BACKSLASH = "\\";
const SLASH = "/";
const NEWLINE = "\n";
const EOF = "";

const SYMBOLS = createOperatorList([
    "( ) [ ] { }",
    ". , ; ...",
    "- + ++ --",
    "* ** / %",
    "<< >> >>>",
    "< <= > >=",
    "== != === !==",
    "& ^ | ! ~",
    "&& ||",
    "? :",
    "= += -= *= /= %= **= <<= >>= >>>= &= ^= |="
]);

const REGEX_SAFE_SYMBOLS = new Set(
    "{ } (  [ { , ; ... - + ++ -- * ** / % << >> >>> < > <= >= == != === !== & ^ | ! ~ && || ? : = += -= *= /= %= **= <<= >>= >>>= &= ^= |=".split(" ")
);

function createOperatorList(types) {
    const root = new Trie;
    for (const list of types) {
        for (const sym of list.split(" ")) {
            root.insert(sym);
        }
    }
    return root;
}

function isLetterExtended(ch) {
    // generated using xregexp - http://xregexp.com/v/3.2.0/xregexp-all.js
    // /^\pL$/
    return /^[A-Za-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠ-ࢴࢶ-ࢽऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡૹଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘ-ౚౠౡಀಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൔ-ൖൟ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏽᏸ-ᏽᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛱ-ᛸᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢄᢇ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᲀ-ᲈᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎↃↄⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々〆〱-〵〻〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿕ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚝꚠ-ꛥꜗ-ꜟꜢ-ꞈꞋ-ꞮꞰ-ꞷꟷ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꣽꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭥꭰ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]$/.test(ch);
}

function extendedSymbolTest(ch) {
    return /^[‿_$\u0336\u2160-\u2188\u200D\u200C]$/.test(ch);
}

// these tests are not perfect, they will not match emojis (as they are symbols) which are technically valid
function isIdentifierStart(ch) {
    return isLetter(ch) || extendedSymbolTest(ch) || isLetterExtended(ch);
}

function isIdentifierCharacter(ch) {
    return isLetter(ch) || extendedSymbolTest(ch) || isNumber(ch) || isLetterExtended(ch);
}

function isLetter(ch) {
    return /^[a-z]$/i.test(ch);
}

function isNumber(ch) {
    return /^\d$/.test(ch);
}

function isSymbol(ch) {
    return SYMBOLS.has(ch);
}

function isWhitespace(ch) {
    return /^\s$/.test(ch) || ch == EOF;
}

function regexTest(token) {
    if (!token)
        return true;

    const {
        type,
        value
    } = token;

    if (type === "symbol")
        return REGEX_SAFE_SYMBOLS.has(value);

    return false;
}

function token (type, position, value, isNewline = false) {
    return {
        type,
        position,
        value,
        isNewline
    };
}

function* lexTemplateliteral(characters, buffer) {
    let position = characters.position();
    characters.next(); // consume backtick

    for (const ch of characters) {
        if (ch === EOF)
            throw new Error("Unterminated template literal");

        if (ch === DOLLAR && characters.peek() === L_BRACE) {
            characters.next(); // consume opening brace

            const string = buffer.consume();

            yield token(
                "templateliteral",
                position,
                string
            );

            yield* lexer(characters, buffer, true);

            position = characters.position();
            buffer.push(characters.next()); // consume closing brace
        } else if (ch === TEMP_QUOTE) {
            buffer.push(ch);
            const string = buffer.consume();

            yield token(
                "templateliteral",
                position,
                string
            );

            return;
        } else {
            buffer.push(ch);
        }
    }
}

function lexIdentifier(characters, buffer) {
    const pos = characters.position();
    for (const ch of characters) {
        if (!isIdentifierCharacter(ch)) {
            const identifier = buffer.consume();
            characters.back();

            return token(
                "identifier",
                pos,
                identifier
            );

        } else {
            buffer.push(ch);
        }
    }
}

function lexNumber(characters, buffer) {
    const pos = characters.position();

    if (characters.peek() === "0") { // might be integer
        const next = characters.peekNext().toLowerCase();

        const isOctal = next === "o"; // 01 octal format is depreciated for 0o1
        const isBinary = next === "b";
        const isHex = next === "x";

        const test = isOctal ? /^[0-7]$/ : isBinary ? /^[01]$/ : isHex ? /^[0-9a-f]$/i : null;

        if (test) {
            buffer.push(characters.consume());
            buffer.push(characters.consume());

            for (const ch of characters) {
                if (!test.test(ch)) {
                    characters.back();
                    break;
                } else {
                    buffer.push(ch);
                }
            }

            return token(
                "number",
                pos,
                buffer.consume()
            );
        }   
    }

    for (const ch of characters) {
        if (!isNumber(ch)) {
            characters.back();
            break;
        } else {
            buffer.push(ch);
        }
    }

    if (characters.peek() === PERIOD) {
        buffer.push(characters.consume());
        for (const ch of characters) {
            if (!isNumber(ch)) {
                break;
            } else {
                buffer.push(ch);
            }
        }
    }

    const next = characters.peek();

    if (next && next.toLowerCase() === "e") {
        buffer.push(characters.consume());
        const next = characters.peek();

        // optional operator
        if (next === "+" || next === "-")
            buffer.push(characters.consume());
        
        // must have at least 1 number!
        if (!isNumber(characters.peek()))
            throw new Error("Invalid or unexpected token");

        for (const ch of characters) {
            if (!isNumber(ch)) {
                break;
            } else {
                buffer.push(ch);
            }
        }
    }

    return token(
        "number",
        pos,
        buffer.consume()
    );    
}

function lexString(characters, delimiter, buffer) {
    const pos = characters.position();
    characters.next(); // consume quote mark
    let isTextEscaped = false;

    for (const ch of characters) {
        if (ch != delimiter || isTextEscaped == true) {
            if (isTextEscaped) {
                isTextEscaped = false;
                buffer.push(ch);
            } else {
                if (ch == BACKSLASH)
                    isTextEscaped = true;
                else
                    buffer.push(ch);
            }
        } else {
 
            return token(
                "string",
                pos,
                buffer.consume()
            );
        }
    }
}

function lexSymbol(characters, buffer, regexAllowed) {
    const pos = characters.position();
    let symbolTrie = SYMBOLS;

    const first = characters.peek();

    if (first === SLASH) {
        const next = characters.peekNext();

        if (next === STAR)
            return lexLongcomment(characters, buffer, pos);
        else if (next === SLASH)
            return lexShortcomment(characters, buffer, pos);
        else if (regexAllowed) // depends on context
            return lexRegex(characters, buffer, pos);
    }

    if (first === PERIOD) { // might be a number starting with a period ( lazy programmers... )
        const next = characters.peekNext();
        if (isNumber(next)) {
            characters.back();
            return lexNumber(characters, buffer);
        }
    }

    for (const ch of characters) {
        const next = symbolTrie.get(ch);

        if (!next) {
            const value = symbolTrie.value;
            if (!value)
                throw new Error("Unexpected character");

            characters.back();

            return token(
                "symbol",
                pos,
                value
            );
        } else
            symbolTrie = next;
    }

    const value = symbolTrie.value;
    if (!value)
        throw new Error("Unexpected end of input");

    return token(
        "symbol",
        pos,
        value
    );
}

function lexLongcomment(characters, buffer, position) {
    characters.next();
    characters.next();
    for (const ch of characters) {
        if (ch === STAR && characters.peek() === SLASH) {
            characters.next(); // consume slash
            // optional comment token here?
            return;
        }
    }
}

function lexShortcomment(characters, buffer, position) {
    characters.next();
    characters.next();
    for (const ch of characters) {
        if (ch === NEWLINE) {
            // optional comment token here?
            return;
        }
    }
}

function lexRegex(characters, buffer, position) {
    let charset = false;
    let escaped = false;

    buffer.push(characters.next().value);

    for (const ch of characters) {
        // newline not allowed
        if (ch === NEWLINE)
            throw new Error("unterminated regex");

        if (escaped) {
            escaped = false;
        } else if (ch === BACKSLASH) {
            escaped = true;
        } else if (charset) {
            if (ch === "]") charset = false;
        } else if (ch === "[")
            charset = true;
        else if (ch === "/") {
            buffer.push(ch);
            break;
        }

        buffer.push(ch);
    }

    for (const ch of characters) {
        if (!isLetter(ch)) {
            characters.back();
            break;
        } else {
            buffer.push(ch);
        }
    }

    return token(
        "regex",
        position,
        buffer.consume()
    );
}

function checkNewline(prev, token) {
    // no previous, first line! so true
    if (!prev)
        token.isNewline = true;

    // not on the same line as the previous token
    else if (prev.position[0] < token.position[0])
        token.isNewline = true;
    
    // return token for streamlining
    return token;
}

function* lexer(characters, buffer, nested) {
    const stack = [];
    let isNewline = false;
    let previousToken = null;

    for (const ch of characters) {
        let token = null;
        if (isIdentifierStart(ch)) {
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

            token = previousToken; // borrow token to store previous for next loop

            // important that we keep track of the last token
            // and the newline status
            for (const t of tokenIterator)
                yield token = checkNewline(token, t);

        } else if (isSymbol(ch)) {
            characters.back();
            const regexAllowed = ch === SLASH && regexTest(previousToken);
            token = lexSymbol(characters, buffer, regexAllowed);
        } else if (!isWhitespace(ch)) {
            throw new Error(`Unknown character ${ch.charCodeAt(0)}`);
        }

        // if we have a token and is newline then attach newline marker
        if (isNewline && token) {
            token.isNewline = true;
            isNewline = false;
        }
        // else if newline char set the marker
        else if (ch === "\n")
            isNewline = true;

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

        if (token)
            yield previousToken = checkNewline(previousToken, token);
    }
}

function lexer$1 (characters) {
    const itr = lexer(characters, new TextBuffer, false);
    return BufferedIterator(itr);
}

const EOF$1 = "";

function createCharacterStream (str) {
    let i = 0;
    const arr = Array.from(str);
    arr.push(EOF$1);
    const l = arr.length;

    let prev = [0, 0];
    let pos = [0, 0];

    return {
        next() {
            const ch = arr[i++];

            prev[0] = pos[0];
            prev[1] = pos[1];

            if (ch === "\n") {
                pos[0]++;
                pos[1] = 0;
            } else
                pos[1]++;

            return {
                value: ch,
                done: i > l
            }
        },
        consume () {
            return this.next().value;
        },
        position() {
            return pos.slice(0);
        },
        peek() {
            return arr[i];
        },
        peekNext() {
            return arr[i + 1];
        },
        back() {
            pos[0] = prev[0];
            pos[1] = prev[1];
            i = i <= 0 ? 0 : i - 1;
        },
        [Symbol.iterator]() {
            return this;
        }
    };
}

class Parselet {
    constructor (precedence = 0) {
        this.precedence = precedence;
    }
    parse (tokens) {
        throw new Error("Not implemented");
    }
}

function notImplemented () {
    throw new Error("not implemented");
}

function unexpectedToken (token, expected) {
    if (expected)
        throw new Error(`Expected "${expected}" @ "${token.position}"`);
    else
        throw new Error(`Unexpected token "${token.value}" @ "${token.position}"`);
}

function unexpectedEnd () {
    throw new Error("Unexpected end of input");
}

function getIdentifier (tokens) {
    notEnd(tokens);
    const token = tokens.consume();
    if (token.type !== "identifier")
        unexpectedToken(token, "identifier");
    
    return token.value;
}

function notEnd (tokens) {
    if (tokens.done())
        unexpectedEnd();
}

function match (tokens, value, type = "symbol") {
    if (tokens.done()) return false;
    const token = tokens.consume();

    if (token.type === type && token.value === value)
        return true;
    tokens.back();
    return false;
}

function ensure (tokens, value, type = "symbol") {
    notEnd(tokens);
    const token = tokens.consume();
    if (token.type !== type || token.value !== value)
        unexpectedToken(token, value);
}

function parseParameters (tokens) {
    const list = [];

    ensure(tokens, "(");
    while (!tokens.done()) {
        if (match(tokens, ")"))
            break;
            
        const exp = parseExpression(tokens, 1);
        list.push(exp);

        if (match(tokens, ")"))
            break;

        if (!match(tokens, ","))
            unexpectedToken(tokens.peek(), ",");
    }

    return list;
}

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

const infixParselets = new Map;
const identifierInfixParselets = new Map;

function register$1 (symbol, parselet) {
    infixParselets.set(symbol, parselet);
}

function registerKeyword$1 (word, parselet) {
    identifierInfixParselets.set(word, parselet);
}

class BinaryOperatorParselet extends Parselet {
    constructor (precedence, isRight = false) {
        super(precedence);
        this.isRight = isRight;
    }
    parse (tokens, left) {
        const operator = tokens.consume();
        const precedence = this.precedence - (this.isRight ? 1 : 0);
        const right = parseExpression(tokens, precedence);

        return {
            type: "binary",
            operator,
            left,
            right
        };
    }
}

class PostfixOperatorParselet extends Parselet {
    parse (tokens, left) {
        return {
            type: "postfix",
            operator: tokens.consume(),
            expression: left
        };
    }
}

class ConditionalParselet extends Parselet {
    parse (tokens, left) {
        ensure(tokens, "?");
        const thenArm = parseExpression(tokens, 0);
        ensure(tokens, ":");
        const elseArm = parseExpression(tokens, this.precedence - 1);

        return {
            type: "conditional",
            condition: left,
            then: thenArm,
            else: elseArm
        };
    }
}

class CallParselet extends Parselet {
    parse (tokens, left) {
        const parameters = parseParameters(tokens);

        return {
            type: "call",
            method: left,
            parameters
        };
    }
}

class MemberParselet extends Parselet {
    parse(tokens, left) {
        ensure(tokens, ".");

        const right = getIdentifier(tokens);

        return {
            type: "member",
            left,
            right
        };
    }
}

class ArrowFunction extends Parselet {
    parse(tokens, left) {
        // TODO validate left
        ensure(tokens, "=>");

        let block;

        if (match(tokens, "{")) {
            tokens.back();
            block = parseBlock(tokens);
        }
        else
            block = parseExpression(this.precedence - 1); // right associative

        return {
            type: "arrow-function",
            parameters: left,
            block
        };
    }
}

class ComputerMemberParselet extends Parselet {
    parse(tokens, left) {
        ensure(tokens, "[");

        const right = parseExpression(tokens, 0);

        ensure(tokens, "]");

        return {
            type: "computermember",
            left,
            right
        };
    }
}

register$1(",", new BinaryOperatorParselet(1));

// 2 - yield & yield* ( unary )

register$1("=", new BinaryOperatorParselet(3, true));
register$1("+=", new BinaryOperatorParselet(3, true));
register$1("-=", new BinaryOperatorParselet(3, true));
register$1("*=", new BinaryOperatorParselet(3, true));
register$1("/=", new BinaryOperatorParselet(3, true));
register$1("%=", new BinaryOperatorParselet(3, true));
register$1("**=", new BinaryOperatorParselet(3, true));
register$1("<<=", new BinaryOperatorParselet(3, true));
register$1(">>=", new BinaryOperatorParselet(3, true));
register$1(">>>=", new BinaryOperatorParselet(3, true));
register$1("&=", new BinaryOperatorParselet(3, true));
register$1("^=", new BinaryOperatorParselet(3, true));
register$1("|=", new BinaryOperatorParselet(3, true));
register$1("=>", new ArrowFunction(3));

register$1("?", new ConditionalParselet(4));

register$1("||", new BinaryOperatorParselet(5));

register$1("&&", new BinaryOperatorParselet(6));

register$1("|", new BinaryOperatorParselet(7));

register$1("^", new BinaryOperatorParselet(8));

register$1("&", new BinaryOperatorParselet(9));

register$1("!==", new BinaryOperatorParselet(10));
register$1("!=", new BinaryOperatorParselet(10));
register$1("==", new BinaryOperatorParselet(10));
register$1("===", new BinaryOperatorParselet(10));

register$1("<", new BinaryOperatorParselet(11));
register$1("<=", new BinaryOperatorParselet(11));
register$1(">", new BinaryOperatorParselet(11));
register$1(">=", new BinaryOperatorParselet(11));
registerKeyword$1("in", new BinaryOperatorParselet(11));
registerKeyword$1("instanceof", new BinaryOperatorParselet(11));

register$1("<<", new BinaryOperatorParselet(12));
register$1(">>", new BinaryOperatorParselet(12));
register$1(">>>", new BinaryOperatorParselet(12));

register$1("+", new BinaryOperatorParselet(13));
register$1("-", new BinaryOperatorParselet(13));

register$1("*", new BinaryOperatorParselet(14));
register$1("/", new BinaryOperatorParselet(14));
register$1("%", new BinaryOperatorParselet(14));

register$1("**", new BinaryOperatorParselet(15, true));

// 16 - lots of unary

register$1("--", new PostfixOperatorParselet(17));
register$1("++", new PostfixOperatorParselet(17));

// 18 - new without argument list ( prefix )

register$1("(", new CallParselet(19));
register$1(".", new MemberParselet(19));
register$1("[", new ComputerMemberParselet(19));

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
        unexpectedEnd();

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
    
    if (token.newline) // for newline detection
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
    
    if (token.newline) // for newline detection
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
    const next = tokens.consume();
    let label = null;

    if (!next) unexpectedEnd();

    if (next.isNewline == false && next.type == "identifier")
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

    if (match(tokens, "{")) {
        tokens.back();
        conditional.thenStatement = parseBlock(tokens);
    }
    else {
        conditional.thenStatement = parseExpressionStatement(tokens);
    }

    return conditional;
}

function register$2 (value, fn) {
    statementParsers.set(value, fn);
}

register$2("let", parseVariableStatement);
register$2("const", parseVariableStatement);
register$2("var", parseVariableStatement);

register$2("break", parseFlow);
register$2("continue", parseFlow);

register$2("return", parseReturnStatement);
register$2("throw", parseThrowStatement);
register$2("debugger", parseDebuggerStatement);

register$2("{", parseBlock);
register$2(";", parseEmptyStatement);

register$2("try", parseTryStatement);

register$2("if", parseConditional);
register$2("while", parseWhileLoop);
register$2("with", parseWith);
register$2("do", parseDo);
register$2("function", parseFunction);
register$2("async", parseAsync);
register$2("for", parseForLoop);
register$2("class", parseClass);

register$2("switch", notImplemented);

register$2("import", notImplemented);
register$2("export", notImplemented);

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

function scan (str) {
    const characters = createCharacterStream(str);
    const tokens = lexer$1(characters);

    return tokens;
}

function parse (str) {
    const characters = createCharacterStream(str);
    const tokens = lexer$1(characters);
    const ast = parseProgram(tokens);

    return ast;
}

export { scan, parse };
