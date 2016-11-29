'use strict';

const assert = require('assert');
require('babel-register');
const parse = require('../index').default;
const mark = require('../index').mark;

describe('Field parser', () => {
    it('parse', () => {
        let model = parse('foo $0 ${1:bar} ${200}${1}');
        assert.equal(model.string, 'foo  bar ');
        assert.equal(model.fields.length, 4);
        assert.deepEqual(model.fields[0], {index: 0, location: 4, length: 0});
        assert.deepEqual(model.fields[1], {index: 1, location: 5, length: 3});
        assert.deepEqual(model.fields[2], {index: 200, location: 9, length: 0});
        assert.deepEqual(model.fields[3], {index: 1, location: 9, length: 0});

        // skip non-fields and escaped fields
        model = parse('foo \\$0 ${bar} ${1f}');
        assert.equal(model.string, 'foo \\$0 ${bar} ${1f}');
        assert.equal(model.fields.length, 0);
    });

    it('mark', () => {
        const model = parse('foo $0 ${1:bar} ${200}${1}');
        assert.equal(mark(model.string, model.fields), 'foo ${0} ${1:bar} ${200}${1}');

        // custom token
        const token = (index, placeholder) =>
            placeholder ? `[[${placeholder}:${index}]]` : `[[${index}]]`;
        assert.equal(mark(model.string, model.fields, token), 'foo [[0]] [[bar:1]] [[200]][[1]]');
    });
});
