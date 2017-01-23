export default {
	entry: './index.js',
	exports: 'named',
	external: ['@emmetio/stream-reader'],
	targets: [
		{format: 'cjs', dest: 'dist/field-parser.cjs.js'},
		{format: 'es',  dest: 'dist/field-parser.es.js'}
	]
};
