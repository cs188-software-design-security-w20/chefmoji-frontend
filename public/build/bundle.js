
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.18.0 */

    const file = "src/App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i].emoji;
    	child_ctx[10] = list[i].type;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (99:3) {#each row as {emoji, type}}
    function create_each_block_1(ctx) {
    	let td;
    	let t_value = /*emoji*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			set_style(td, "background-color", /*type*/ ctx[10]);
    			attr_dev(td, "class", "svelte-13qlg0");
    			add_location(td, file, 99, 4, 8340);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*map*/ 1 && t_value !== (t_value = /*emoji*/ ctx[9] + "")) set_data_dev(t, t_value);

    			if (dirty & /*map*/ 1) {
    				set_style(td, "background-color", /*type*/ ctx[10]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(99:3) {#each row as {emoji, type}}",
    		ctx
    	});

    	return block;
    }

    // (97:1) {#each map as row}
    function create_each_block(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*row*/ ctx[6];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(tr, file, 97, 2, 8299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*map*/ 1) {
    				each_value_1 = /*row*/ ctx[6];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(97:1) {#each map as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let table;
    	let dispose;
    	let each_value = /*map*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(table, "class", "svelte-13qlg0");
    			add_location(table, file, 95, 0, 8269);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*map*/ 1) {
    				each_value = /*map*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const WALL = "#000";
    const TABLE = "#ecb476";
    const FLOOR = "#fff";
    const FRIDGE = "#75c3d1";

    function instance($$self, $$props, $$invalidate) {
    	let map = [
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "🧈", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "🥚", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "🚰", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "♨️", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "🔪", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "🥛", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "🌾", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "🥕", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "🧀", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "🍚", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "🥬", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "➡️", type: TABLE },
    			{ emoji: "➡️", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "🍅", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "🥩", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "🍞", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "🐟", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "🧅", type: TABLE },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: FLOOR },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "🐖", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: FRIDGE },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "🥔", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "🧄", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "🍽️", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: TABLE },
    			{ emoji: "", type: WALL }
    		],
    		[
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL },
    			{ emoji: "", type: WALL }
    		]
    	];

    	class Player {
    		constructor(r, c, emoji) {
    			this.r = r;
    			this.c = c;
    			this.emoji = emoji;
    		}
    	}

    	let player = new Player(2, 3, "🧠");
    	movePlayer(player);
    	let key;

    	function handleKeydown(event) {
    		key = event.key;

    		if (key == "w" || key == "ArrowUp") {
    			// UP
    			if (map[player.r - 1][player.c].type == FLOOR) {
    				$$invalidate(0, map[player.r][player.c].emoji = "", map);
    				player.r -= 1;
    				movePlayer(player);
    			}
    		} else if (key == "a" || key == "ArrowLeft") {
    			// LEFT
    			if (map[player.r][player.c - 1].type == FLOOR) {
    				$$invalidate(0, map[player.r][player.c].emoji = "", map);
    				player.c -= 1;
    				movePlayer(player);
    			}
    		} else if (key == "s" || key == "ArrowDown") {
    			// DOWN
    			if (map[player.r + 1][player.c].type == FLOOR) {
    				$$invalidate(0, map[player.r][player.c].emoji = "", map);
    				player.r += 1;
    				movePlayer(player);
    			}
    		} else if (key == "d" || key == "ArrowRight") {
    			// RIGHT
    			if (map[player.r][player.c + 1].type == FLOOR) {
    				$$invalidate(0, map[player.r][player.c].emoji = "", map);
    				player.c += 1;
    				movePlayer(player);
    			}
    		}
    	}

    	function movePlayer(p) {
    		$$invalidate(0, map[p.r][p.c].emoji = p.emoji, map);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("map" in $$props) $$invalidate(0, map = $$props.map);
    		if ("player" in $$props) player = $$props.player;
    		if ("key" in $$props) key = $$props.key;
    	};

    	return [map, handleKeydown];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
