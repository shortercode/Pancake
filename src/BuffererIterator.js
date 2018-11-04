/*
    Wrapper for an iterator/generator that has a persistent state and
    buffering to provide 2 value lookahead, 1 value lookbehind and step back
*/

export default function BufferedIterator (itr) {
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
