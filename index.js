'use strict';

import StringStream from './lib/string-stream';

/**
 * Finds fields in given string and returns object with field-less string
 * and array of fileds found
 * @param  {String} string
 * @return {Object}
 */
export default function parse(string) {
    const stream = new StringStream(string);
    const fields = [];
    let cleanString = '', field;

    while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') {
            cleanString += ch + stream.next();
        } else if (ch === '$' && (field = consumeField(stream))) {
            fields.push({
                index: field.index,
                location: cleanString.length,
                length: field.placeholder.length
            });
            cleanString += field.placeholder;
        } else {
            cleanString += ch;
        }
    }

    return {fields, string: cleanString};
}

/**
 * Marks given `string` with `fields`: wraps each field range with
 * `${index:placeholder}` (by default) or any other token produced by `token`
 * function, if provided
 * @param  {String} string String to mark
 * @param  {Array} fields Array of field descriptor. A field descriptor is a
 * `{index, location, length}` array. It is important that fields in array
 * must be ordered by their location in string: some fields my refer the same
 * location so they must appear in order that user expects.
 * @param  {Function} [token] Function that generates field token. This function
 * received two arguments: `index` and `placeholder` and should return string
 * @return {String}  String with marked fields
 */
export function mark(string, fields, token) {
    token = token || createToken;

    // order fields by their location and appearence
    // NB field ranges should not overlap! (not supported yet)
    const ordered = fields
    .map((field, order) => ({order, field, end: field.location + field.length}))
    .sort((a, b) => (a.end - b.end) || (a.order - b.order));

    // mark ranges in string
    let offset = 0;
    const result = ordered.map(item => {
        const placeholder = string.substr(item.field.location, item.field.length);
        const prefix = string.slice(offset, item.field.location);
        offset = item.end;
        return prefix + token(item.field.index, placeholder);
    });

    return result.join('') + string.slice(offset);
}

/**
 * Creates field token for string
 * @param  {Number} index       Field index
 * @param  {String} placeholder Field placeholder, could be empty string
 * @return {String}
 */
export function createToken(index, placeholder) {
    return placeholder ? `\${${index}:${placeholder}}` : `\${${index}}`;
}

/**
 * Consumes field from current stream position: it can be an `index` or
 * or `{index}` or `{index:placeholder}`
 * @param  {StringStream} stream
 * @return {Object} Object with `index` and `placeholder` properties if
 * fieald was successfully consumed, `null` otherwise
 */
function consumeField(stream) {
    let index = consumeIndex(stream);
    let placeholder = '';

    // consumed $index placeholder
    if (index != null) {
        return {index, placeholder};
    }

    if (stream.peek() === '{') {
        const start = stream.pos;

        stream.next();
        index = consumeIndex(stream);
        if (index != null) {
            if (stream.peek() === ':') {
                stream.next();
                placeholder = consumePlaceholder(stream);
            }

            if (stream.next() === '}') {
                return {index, placeholder};
            }
        }

        // If we reached here then there’s no valid field here, revert
        // back to starting position
        stream.pos = start;
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
function consumeIndex(stream) {
    let result = '';
    while (/[0-9]/.test(stream.peek())) {
        result += stream.next();
    }

    return result ? Number(result) : null;
}
