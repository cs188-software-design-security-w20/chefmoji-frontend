import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';

const production = false;
const build_into = process.env.BUILD_INTO || 'public';

export default {
	input: 'src/lobby.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: build_into+'/build/bundle.lobby.js'
	},
	plugins: [
		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration —
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		replace({__buildEnv__: production}),
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs({
			namedExports: {
                './src/proto/compiled.js': ['MapUpdate']
            }
		}),

		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file — better for performance
			css: css => {
				css.write('public/build/bundle.lobby.css');
			}
		}),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}