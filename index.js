'use strict';

const EOF = "";

function createCharacterStream (str) {
    let i = 0;
    const arr = Array.from(str);
    arr.push(EOF);
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
const EOF$1 = "";

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
    "( [ { , ; ... - + ++ -- * ** / % << >> >>> < > <= >= == != === !== & ^ | ! ~ && || ? : = += -= *= /= %= **= <<= >>= >>>= &= ^= |=".split(" ")
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

// these tests are not perfect, they will not match emojis (as they are symbols) which are technically valid
function isIdentifierStart(ch) {
    return isLetter(ch) || ch == "_" || ch == "$" || isLetterExtended(ch);
}

function isIdentifierCharacter(ch) {
    return isLetter(ch) || ch == "_" || ch == "$" || isNumber(ch) || isLetterExtended(ch);
}

function isLetter(ch) {
    return /^\w$/.test(ch);
}

function isNumber(ch) {
    return /^\d$/.test(ch);
}

function isSymbol(ch) {
    return SYMBOLS.has(ch);
}

function isWhitespace(ch) {
    return /^\s$/.test(ch) || ch == EOF$1;
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

function* lexTemplateliteral(characters, buffer) {
    let position = characters.position();
    characters.next(); // consume backtick

    for (const ch of characters) {
        if (ch === EOF$1)
            throw new Error("Unterminated template literal");

        if (ch === DOLLAR && characters.peek() === L_BRACE) {
            characters.next(); // consume opening brace

            const string = buffer.consume();
            yield {
                type: "templateliteral",
                position,
                value: string
            };

            yield* lexer(characters, buffer, true);

            position = characters.position();
            buffer.push(characters.next()); // consume closing brace
        } else if (ch === TEMP_QUOTE) {
            buffer.push(ch);
            const string = buffer.consume();
            yield {
                type: "templateliteral",
                position,
                value: string
            };
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
            return {
                type: "identifier",
                position: pos,
                value: identifier
            };
        } else {
            buffer.push(ch);
        }
    }
}

function lexNumber(characters, buffer) {
    const pos = characters.position();
    for (const ch of characters) {
        if (ch == PERIOD) {
            push(ch);
            break;
        } else if (!isNumber(ch)) {
            const number = buffer.consume();
            return {
                type: "number",
                position: pos,
                value: number
            };
        } else {
            buffer.push(ch);
        }
    }

    for (const ch of characters) {
        if (!isNumber(ch)) {
            const number = buffer.consume();
            return {
                type: "number",
                position: pos,
                value: number
            };
        } else {
            buffer.push(ch);
        }
    }
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
            const string = buffer.consume();
            return {
                type: "string",
                position: pos,
                value: string
            };
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

    for (const ch of characters) {
        const next = symbolTrie.get(ch);

        if (!next) {
            const value = symbolTrie.value;
            if (!value)
                throw new Error("Unexpected character");

            characters.back();

            return {
                type: "symbol",
                position: pos,
                value
            };
        } else
            symbolTrie = next;
    }
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

    const statement = buffer.consume();

    return {
        type: "regex",
        position,
        value: statement
    };
}

function* lexer(characters, buffer = new TextBuffer, nested = false) {
    const stack = [];
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

            // important that we keep track of the last token
            for (const t of tokenIterator) {
                token = t;
                yield t;
            }
        } else if (isSymbol(ch)) {
            characters.back();
            const regexAllowed = ch === SLASH && regexTest(previousToken);
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

function parseJavaScript(str) {
    const characters = createCharacterStream(str);
    const tokens = lexer(characters);
    // TODO write parsing stage
    // const ast = Parser(tokens);

    return tokens; // iterator
}

module.exports = parseJavaScript;
