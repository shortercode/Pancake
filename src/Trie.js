export default class Trie extends Map {
        constructor () {
            super();
            this.result = null;
        }
        find (key) {
            return Trie.find(this, key);
        }
        insert (key, value = key) {
            return Trie.insert(this, key, value);
        }
        static find (root, key) {
            let node = root;
            for (const char of key) {
                node = node.get(char);
                if (!node)
                    return null;
            }
            return node.value;
        }
        static insert (root, key, value = key) {
            let node = root;

            for  (const char of key) {
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
