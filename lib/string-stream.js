'use strict';

/**
 * A lightweight version of StringStream, used in Emmet abbreviation parser
 */
export default class StringStream {
    constructor(string) {
        this.string = string;
        this.pos = 0;
        this.len = string.length;
    }

    eol() {
        return this.pos >= this.len;
    }

    next() {
        if (this.pos < this.len) {
            return this.string[this.pos++];
        }
    }

    peek() {
        return this.string[this.pos];
    }
}
