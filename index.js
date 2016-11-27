'use strict';

/**
 * Finds fields in given string and returns object with field-less string
 * and array of fileds found
 * @param  {String} string
 * @return {Object}
 */
export default function parse(string) {
    const stream = new StringStream(string);
    let cleanString = '', field;
    const fields = new Map();

    while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') {
            cleanString += ch + stream.next();
        } else if (ch === '$' && (field = consumeField(stream))) {
            cleanString += field.placeholder;
            if (!fields.has(field.index)) {
                fields.set(field.index, []);
            }
            fields.get(field.index).push([cleanString.length, field.placeholder.length]);
        } else {
            cleanString += ch;
        }
    }

    return {fields, string: cleanString};
}

/**
 * Consumes field from current stream position: it can be an `index` or
 * or `{index}` or `{index:placeholder}`
 * @param  {StringStream} stream
 * @return {Object} Object with `index` and `placeholder` properties if
 * fieald was successfully consumed, `null` otherwise
 */
function consumeField(stream) {
    let index = consumeNumber(stream);
    let placeholder = '';

    // consumed $index placeholder
    if (index) {
        return {index, placeholder};
    }

    if (stream.peek() === '{') {
        stream.next();
        if (index = consumeNumber(stream)) {
            if (stream.peek() === ':') {
                stream.next();
                placeholder = consumePlaceholder(stream);
            }

            if (stream.next() === '}') {
                return {index, placeholder};
            }
        }
    }
}

/**
 * Consumes a placeholder: value right after `:` in field. Could be empty
 * @param  {StringStream} stream
 * @return {String}
 */
function consumePlaceholder(stream) {
    const start = stream.pos;
    let stack = [];

    while (!stream.eol()) {
        const ch = stream.peek();
        if (ch === '{') {
            stack.push(stream.pos);
        } else if (ch === '}') {
            if (!stack.length) {
                break;
            }
            stack.pop();
        }
        stream.pos++;
    }

    if (stack.length) {
        const pos = stack.pop();
        const err = new Error('Unable to find matching "}" for curly brace at ' + stack.pop());
        err.pos = pos;
        throw err;
    }

    return stream.string.slice(start, stream.pos);
}

/**
 * Consumes integer from current stream position
 * @param  {StringStream} stream
 * @return {Number}
 */
function consumeNumber(stream) {
    let result = '';
    while (/[0-9]/.test(stream.peek())) {
        result += stream.next();
    }

    return result ? +number : null;
}

class StringStream {
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
