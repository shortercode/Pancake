import BufferedIterator from "./BuffererIterator";

function* parse (tokens) {

}

export default function (tokens) {
    const itr = parse(tokens);
    return BufferedIterator(itr);
}