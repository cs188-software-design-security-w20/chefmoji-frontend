
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
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
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

    /* src/Order.svelte generated by Svelte v3.18.0 */

    const { console: console_1 } = globals;
    const file = "src/Order.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (52:8) {#if order.cooked}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cooked");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(52:8) {#if order.cooked}",
    		ctx
    	});

    	return block;
    }

    // (59:20) {#if ingredient.chopped}
    function create_if_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "chopped";
    			attr_dev(span, "class", "variant svelte-95ou0c");
    			add_location(span, file, 59, 24, 1324);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(59:20) {#if ingredient.chopped}",
    		ctx
    	});

    	return block;
    }

    // (56:12) {#each order.ingredients as ingredient}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*ingredient*/ ctx[1].emoji + "";
    	let t0;
    	let t1;
    	let t2;
    	let if_block = /*ingredient*/ ctx[1].chopped && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			attr_dev(div, "class", "ingredient svelte-95ou0c");
    			add_location(div, file, 56, 16, 1191);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*order*/ 1 && t0_value !== (t0_value = /*ingredient*/ ctx[1].emoji + "")) set_data_dev(t0, t0_value);

    			if (/*ingredient*/ ctx[1].chopped) {
    				if (!if_block) {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(56:12) {#each order.ingredients as ingredient}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div6;
    	let div1;
    	let t0;
    	let div0;
    	let t1;
    	let div3;
    	let t2;
    	let div2;
    	let t4;
    	let div5;
    	let t5;
    	let div4;
    	let t6_value = /*order*/ ctx[0].emoji + "";
    	let t6;
    	let if_block = /*order*/ ctx[0].cooked && create_if_block_1(ctx);
    	let each_value = /*order*/ ctx[0].ingredients;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div3 = element("div");
    			t2 = text("‎\n        ");
    			div2 = element("div");
    			div2.textContent = "👉🏼";
    			t4 = space();
    			div5 = element("div");
    			t5 = text("Plated\n        ");
    			div4 = element("div");
    			t6 = text(t6_value);
    			attr_dev(div0, "class", "ingredients svelte-95ou0c");
    			add_location(div0, file, 54, 8, 1097);
    			attr_dev(div1, "class", "cooked-wrapper svelte-95ou0c");
    			add_location(div1, file, 50, 4, 1000);
    			attr_dev(div2, "class", "item svelte-95ou0c");
    			add_location(div2, file, 69, 8, 1556);
    			attr_dev(div3, "class", "top-wrapper svelte-95ou0c");
    			add_location(div3, file, 67, 4, 1512);
    			attr_dev(div4, "class", "item svelte-95ou0c");
    			add_location(div4, file, 75, 8, 1716);
    			attr_dev(div5, "class", "top-wrapper svelte-95ou0c");
    			set_style(div5, "background-color", "rgb(150, 214, 150)");
    			add_location(div5, file, 73, 4, 1622);
    			attr_dev(div6, "class", "order svelte-95ou0c");
    			add_location(div6, file, 49, 0, 976);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div6, t1);
    			append_dev(div6, div3);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div6, t4);
    			append_dev(div6, div5);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*order*/ ctx[0].cooked) {
    				if (!if_block) {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div1, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*order*/ 1) {
    				each_value = /*order*/ ctx[0].ingredients;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*order*/ 1 && t6_value !== (t6_value = /*order*/ ctx[0].emoji + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
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

    function instance($$self, $$props, $$invalidate) {
    	let { order } = $$props;
    	console.log(order);
    	const writable_props = ["order"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Order> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("order" in $$props) $$invalidate(0, order = $$props.order);
    	};

    	$$self.$capture_state = () => {
    		return { order };
    	};

    	$$self.$inject_state = $$props => {
    		if ("order" in $$props) $$invalidate(0, order = $$props.order);
    	};

    	return [order];
    }

    class Order extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { order: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Order",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*order*/ ctx[0] === undefined && !("order" in props)) {
    			console_1.warn("<Order> was created without expected prop 'order'");
    		}
    	}

    	get order() {
    		throw new Error("<Order>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set order(value) {
    		throw new Error("<Order>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var socket_io = createCommonjsModule(function (module, exports) {
    /*!
     * Socket.IO v2.3.0
     * (c) 2014-2019 Guillermo Rauch
     * Released under the MIT License.
     */
    !function(t,e){module.exports=e();}(commonjsGlobal,function(){return function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e,n){function r(t,e){"object"==typeof t&&(e=t,t=void 0),e=e||{};var n,r=o(t),i=r.source,u=r.id,p=r.path,h=c[u]&&p in c[u].nsps,f=e.forceNew||e["force new connection"]||!1===e.multiplex||h;return f?(a("ignoring socket cache for %s",i),n=s(i,e)):(c[u]||(a("new io instance for %s",i),c[u]=s(i,e)),n=c[u]),r.query&&!e.query&&(e.query=r.query),n.socket(r.path,e)}var o=n(1),i=n(7),s=n(15),a=n(3)("socket.io-client");t.exports=e=r;var c=e.managers={};e.protocol=i.protocol,e.connect=r,e.Manager=n(15),e.Socket=n(39);},function(t,e,n){function r(t,e){var n=t;e=e||"undefined"!=typeof location&&location,null==t&&(t=e.protocol+"//"+e.host),"string"==typeof t&&("/"===t.charAt(0)&&(t="/"===t.charAt(1)?e.protocol+t:e.host+t),/^(https?|wss?):\/\//.test(t)||(i("protocol-less url %s",t),t="undefined"!=typeof e?e.protocol+"//"+t:"https://"+t),i("parse %s",t),n=o(t)),n.port||(/^(http|ws)$/.test(n.protocol)?n.port="80":/^(http|ws)s$/.test(n.protocol)&&(n.port="443")),n.path=n.path||"/";var r=n.host.indexOf(":")!==-1,s=r?"["+n.host+"]":n.host;return n.id=n.protocol+"://"+s+":"+n.port,n.href=n.protocol+"://"+s+(e&&e.port===n.port?"":":"+n.port),n}var o=n(2),i=n(3)("socket.io-client:url");t.exports=r;},function(t,e){var n=/^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,r=["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"];t.exports=function(t){var e=t,o=t.indexOf("["),i=t.indexOf("]");o!=-1&&i!=-1&&(t=t.substring(0,o)+t.substring(o,i).replace(/:/g,";")+t.substring(i,t.length));for(var s=n.exec(t||""),a={},c=14;c--;)a[r[c]]=s[c]||"";return o!=-1&&i!=-1&&(a.source=e,a.host=a.host.substring(1,a.host.length-1).replace(/;/g,":"),a.authority=a.authority.replace("[","").replace("]","").replace(/;/g,":"),a.ipv6uri=!0),a};},function(t,e,n){(function(r){function o(){return !("undefined"==typeof window||!window.process||"renderer"!==window.process.type&&!window.process.__nwjs)||("undefined"==typeof navigator||!navigator.userAgent||!navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))&&("undefined"!=typeof document&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||"undefined"!=typeof window&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))}function i(e){if(e[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+e[0]+(this.useColors?"%c ":" ")+"+"+t.exports.humanize(this.diff),this.useColors){var n="color: "+this.color;e.splice(1,0,n,"color: inherit");var r=0,o=0;e[0].replace(/%[a-zA-Z%]/g,function(t){"%%"!==t&&(r++,"%c"===t&&(o=r));}),e.splice(o,0,n);}}function s(){var t;return "object"===("undefined"==typeof console?"undefined":p(console))&&console.log&&(t=console).log.apply(t,arguments)}function a(t){try{t?e.storage.setItem("debug",t):e.storage.removeItem("debug");}catch(n){}}function c(){var t=void 0;try{t=e.storage.getItem("debug");}catch(n){}return !t&&"undefined"!=typeof r&&"env"in r&&(t=r.env.DEBUG),t}function u(){try{return localStorage}catch(t){}}var p="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};e.log=s,e.formatArgs=i,e.save=a,e.load=c,e.useColors=o,e.storage=u(),e.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"],t.exports=n(5)(e);var h=t.exports.formatters;h.j=function(t){try{return JSON.stringify(t)}catch(e){return "[UnexpectedJSONParseError]: "+e.message}};}).call(e,n(4));},function(t,e){function n(){throw new Error("setTimeout has not been defined")}function r(){throw new Error("clearTimeout has not been defined")}function o(t){if(p===setTimeout)return setTimeout(t,0);if((p===n||!p)&&setTimeout)return p=setTimeout,setTimeout(t,0);try{return p(t,0)}catch(e){try{return p.call(null,t,0)}catch(e){return p.call(this,t,0)}}}function i(t){if(h===clearTimeout)return clearTimeout(t);if((h===r||!h)&&clearTimeout)return h=clearTimeout,clearTimeout(t);try{return h(t)}catch(e){try{return h.call(null,t)}catch(e){return h.call(this,t)}}}function s(){y&&l&&(y=!1,l.length?d=l.concat(d):m=-1,d.length&&a());}function a(){if(!y){var t=o(s);y=!0;for(var e=d.length;e;){for(l=d,d=[];++m<e;)l&&l[m].run();m=-1,e=d.length;}l=null,y=!1,i(t);}}function c(t,e){this.fun=t,this.array=e;}function u(){}var p,h,f=t.exports={};!function(){try{p="function"==typeof setTimeout?setTimeout:n;}catch(t){p=n;}try{h="function"==typeof clearTimeout?clearTimeout:r;}catch(t){h=r;}}();var l,d=[],y=!1,m=-1;f.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)e[n-1]=arguments[n];d.push(new c(t,e)),1!==d.length||y||o(a);},c.prototype.run=function(){this.fun.apply(null,this.array);},f.title="browser",f.browser=!0,f.env={},f.argv=[],f.version="",f.versions={},f.on=u,f.addListener=u,f.once=u,f.off=u,f.removeListener=u,f.removeAllListeners=u,f.emit=u,f.prependListener=u,f.prependOnceListener=u,f.listeners=function(t){return []},f.binding=function(t){throw new Error("process.binding is not supported")},f.cwd=function(){return "/"},f.chdir=function(t){throw new Error("process.chdir is not supported")},f.umask=function(){return 0};},function(t,e,n){function r(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return Array.from(t)}function o(t){function e(t){for(var e=0,n=0;n<t.length;n++)e=(e<<5)-e+t.charCodeAt(n),e|=0;return o.colors[Math.abs(e)%o.colors.length]}function o(t){function n(){for(var t=arguments.length,e=Array(t),i=0;i<t;i++)e[i]=arguments[i];if(n.enabled){var s=n,a=Number(new Date),c=a-(r||a);s.diff=c,s.prev=r,s.curr=a,r=a,e[0]=o.coerce(e[0]),"string"!=typeof e[0]&&e.unshift("%O");var u=0;e[0]=e[0].replace(/%([a-zA-Z%])/g,function(t,n){if("%%"===t)return t;u++;var r=o.formatters[n];if("function"==typeof r){var i=e[u];t=r.call(s,i),e.splice(u,1),u--;}return t}),o.formatArgs.call(s,e);var p=s.log||o.log;p.apply(s,e);}}var r=void 0;return n.namespace=t,n.enabled=o.enabled(t),n.useColors=o.useColors(),n.color=e(t),n.destroy=i,n.extend=s,"function"==typeof o.init&&o.init(n),o.instances.push(n),n}function i(){var t=o.instances.indexOf(this);return t!==-1&&(o.instances.splice(t,1),!0)}function s(t,e){var n=o(this.namespace+("undefined"==typeof e?":":e)+t);return n.log=this.log,n}function a(t){o.save(t),o.names=[],o.skips=[];var e=void 0,n=("string"==typeof t?t:"").split(/[\s,]+/),r=n.length;for(e=0;e<r;e++)n[e]&&(t=n[e].replace(/\*/g,".*?"),"-"===t[0]?o.skips.push(new RegExp("^"+t.substr(1)+"$")):o.names.push(new RegExp("^"+t+"$")));for(e=0;e<o.instances.length;e++){var i=o.instances[e];i.enabled=o.enabled(i.namespace);}}function c(){var t=[].concat(r(o.names.map(p)),r(o.skips.map(p).map(function(t){return "-"+t}))).join(",");return o.enable(""),t}function u(t){if("*"===t[t.length-1])return !0;var e=void 0,n=void 0;for(e=0,n=o.skips.length;e<n;e++)if(o.skips[e].test(t))return !1;for(e=0,n=o.names.length;e<n;e++)if(o.names[e].test(t))return !0;return !1}function p(t){return t.toString().substring(2,t.toString().length-2).replace(/\.\*\?$/,"*")}function h(t){return t instanceof Error?t.stack||t.message:t}return o.debug=o,o["default"]=o,o.coerce=h,o.disable=c,o.enable=a,o.enabled=u,o.humanize=n(6),Object.keys(t).forEach(function(e){o[e]=t[e];}),o.instances=[],o.names=[],o.skips=[],o.formatters={},o.selectColor=e,o.enable(o.load()),o}t.exports=o;},function(t,e){function n(t){if(t=String(t),!(t.length>100)){var e=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(t);if(e){var n=parseFloat(e[1]),r=(e[2]||"ms").toLowerCase();switch(r){case"years":case"year":case"yrs":case"yr":case"y":return n*h;case"weeks":case"week":case"w":return n*p;case"days":case"day":case"d":return n*u;case"hours":case"hour":case"hrs":case"hr":case"h":return n*c;case"minutes":case"minute":case"mins":case"min":case"m":return n*a;case"seconds":case"second":case"secs":case"sec":case"s":return n*s;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return n;default:return}}}}function r(t){var e=Math.abs(t);return e>=u?Math.round(t/u)+"d":e>=c?Math.round(t/c)+"h":e>=a?Math.round(t/a)+"m":e>=s?Math.round(t/s)+"s":t+"ms"}function o(t){var e=Math.abs(t);return e>=u?i(t,e,u,"day"):e>=c?i(t,e,c,"hour"):e>=a?i(t,e,a,"minute"):e>=s?i(t,e,s,"second"):t+" ms"}function i(t,e,n,r){var o=e>=1.5*n;return Math.round(t/n)+" "+r+(o?"s":"")}var s=1e3,a=60*s,c=60*a,u=24*c,p=7*u,h=365.25*u;t.exports=function(t,e){e=e||{};var i=typeof t;if("string"===i&&t.length>0)return n(t);if("number"===i&&isFinite(t))return e["long"]?o(t):r(t);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(t))};},function(t,e,n){function r(){}function o(t){var n=""+t.type;if(e.BINARY_EVENT!==t.type&&e.BINARY_ACK!==t.type||(n+=t.attachments+"-"),t.nsp&&"/"!==t.nsp&&(n+=t.nsp+","),null!=t.id&&(n+=t.id),null!=t.data){var r=i(t.data);if(r===!1)return g;n+=r;}return f("encoded %j as %s",t,n),n}function i(t){try{return JSON.stringify(t)}catch(e){return !1}}function s(t,e){function n(t){var n=d.deconstructPacket(t),r=o(n.packet),i=n.buffers;i.unshift(r),e(i);}d.removeBlobs(t,n);}function a(){this.reconstructor=null;}function c(t){var n=0,r={type:Number(t.charAt(0))};if(null==e.types[r.type])return h("unknown packet type "+r.type);if(e.BINARY_EVENT===r.type||e.BINARY_ACK===r.type){for(var o="";"-"!==t.charAt(++n)&&(o+=t.charAt(n),n!=t.length););if(o!=Number(o)||"-"!==t.charAt(n))throw new Error("Illegal attachments");r.attachments=Number(o);}if("/"===t.charAt(n+1))for(r.nsp="";++n;){var i=t.charAt(n);if(","===i)break;if(r.nsp+=i,n===t.length)break}else r.nsp="/";var s=t.charAt(n+1);if(""!==s&&Number(s)==s){for(r.id="";++n;){var i=t.charAt(n);if(null==i||Number(i)!=i){--n;break}if(r.id+=t.charAt(n),n===t.length)break}r.id=Number(r.id);}if(t.charAt(++n)){var a=u(t.substr(n)),c=a!==!1&&(r.type===e.ERROR||y(a));if(!c)return h("invalid payload");r.data=a;}return f("decoded %s as %j",t,r),r}function u(t){try{return JSON.parse(t)}catch(e){return !1}}function p(t){this.reconPack=t,this.buffers=[];}function h(t){return {type:e.ERROR,data:"parser error: "+t}}var f=n(8)("socket.io-parser"),l=n(11),d=n(12),y=n(13),m=n(14);e.protocol=4,e.types=["CONNECT","DISCONNECT","EVENT","ACK","ERROR","BINARY_EVENT","BINARY_ACK"],e.CONNECT=0,e.DISCONNECT=1,e.EVENT=2,e.ACK=3,e.ERROR=4,e.BINARY_EVENT=5,e.BINARY_ACK=6,e.Encoder=r,e.Decoder=a;var g=e.ERROR+'"encode error"';r.prototype.encode=function(t,n){if(f("encoding packet %j",t),e.BINARY_EVENT===t.type||e.BINARY_ACK===t.type)s(t,n);else{var r=o(t);n([r]);}},l(a.prototype),a.prototype.add=function(t){var n;if("string"==typeof t)n=c(t),e.BINARY_EVENT===n.type||e.BINARY_ACK===n.type?(this.reconstructor=new p(n),0===this.reconstructor.reconPack.attachments&&this.emit("decoded",n)):this.emit("decoded",n);else{if(!m(t)&&!t.base64)throw new Error("Unknown type: "+t);if(!this.reconstructor)throw new Error("got binary data when not reconstructing a packet");n=this.reconstructor.takeBinaryData(t),n&&(this.reconstructor=null,this.emit("decoded",n));}},a.prototype.destroy=function(){this.reconstructor&&this.reconstructor.finishedReconstruction();},p.prototype.takeBinaryData=function(t){if(this.buffers.push(t),this.buffers.length===this.reconPack.attachments){var e=d.reconstructPacket(this.reconPack,this.buffers);return this.finishedReconstruction(),e}return null},p.prototype.finishedReconstruction=function(){this.reconPack=null,this.buffers=[];};},function(t,e,n){(function(r){function o(){return !("undefined"==typeof window||!window.process||"renderer"!==window.process.type)||("undefined"==typeof navigator||!navigator.userAgent||!navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))&&("undefined"!=typeof document&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||"undefined"!=typeof window&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31||"undefined"!=typeof navigator&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))}function i(t){var n=this.useColors;if(t[0]=(n?"%c":"")+this.namespace+(n?" %c":" ")+t[0]+(n?"%c ":" ")+"+"+e.humanize(this.diff),n){var r="color: "+this.color;t.splice(1,0,r,"color: inherit");var o=0,i=0;t[0].replace(/%[a-zA-Z%]/g,function(t){"%%"!==t&&(o++,"%c"===t&&(i=o));}),t.splice(i,0,r);}}function s(){return "object"===("undefined"==typeof console?"undefined":p(console))&&console.log&&Function.prototype.apply.call(console.log,console,arguments)}function a(t){try{null==t?e.storage.removeItem("debug"):e.storage.debug=t;}catch(n){}}function c(){var t;try{t=e.storage.debug;}catch(n){}return !t&&"undefined"!=typeof r&&"env"in r&&(t=r.env.DEBUG),t}function u(){try{return window.localStorage}catch(t){}}var p="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};e=t.exports=n(9),e.log=s,e.formatArgs=i,e.save=a,e.load=c,e.useColors=o,e.storage="undefined"!=typeof chrome&&"undefined"!=typeof chrome.storage?chrome.storage.local:u(),e.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"],e.formatters.j=function(t){try{return JSON.stringify(t)}catch(e){return "[UnexpectedJSONParseError]: "+e.message}},e.enable(c());}).call(e,n(4));},function(t,e,n){function r(t){var n,r=0;for(n in t)r=(r<<5)-r+t.charCodeAt(n),r|=0;return e.colors[Math.abs(r)%e.colors.length]}function o(t){function n(){if(n.enabled){var t=n,r=+new Date,i=r-(o||r);t.diff=i,t.prev=o,t.curr=r,o=r;for(var s=new Array(arguments.length),a=0;a<s.length;a++)s[a]=arguments[a];s[0]=e.coerce(s[0]),"string"!=typeof s[0]&&s.unshift("%O");var c=0;s[0]=s[0].replace(/%([a-zA-Z%])/g,function(n,r){if("%%"===n)return n;c++;var o=e.formatters[r];if("function"==typeof o){var i=s[c];n=o.call(t,i),s.splice(c,1),c--;}return n}),e.formatArgs.call(t,s);var u=n.log||e.log||console.log.bind(console);u.apply(t,s);}}var o;return n.namespace=t,n.enabled=e.enabled(t),n.useColors=e.useColors(),n.color=r(t),n.destroy=i,"function"==typeof e.init&&e.init(n),e.instances.push(n),n}function i(){var t=e.instances.indexOf(this);return t!==-1&&(e.instances.splice(t,1),!0)}function s(t){e.save(t),e.names=[],e.skips=[];var n,r=("string"==typeof t?t:"").split(/[\s,]+/),o=r.length;for(n=0;n<o;n++)r[n]&&(t=r[n].replace(/\*/g,".*?"),"-"===t[0]?e.skips.push(new RegExp("^"+t.substr(1)+"$")):e.names.push(new RegExp("^"+t+"$")));for(n=0;n<e.instances.length;n++){var i=e.instances[n];i.enabled=e.enabled(i.namespace);}}function a(){e.enable("");}function c(t){if("*"===t[t.length-1])return !0;var n,r;for(n=0,r=e.skips.length;n<r;n++)if(e.skips[n].test(t))return !1;for(n=0,r=e.names.length;n<r;n++)if(e.names[n].test(t))return !0;return !1}function u(t){return t instanceof Error?t.stack||t.message:t}e=t.exports=o.debug=o["default"]=o,e.coerce=u,e.disable=a,e.enable=s,e.enabled=c,e.humanize=n(10),e.instances=[],e.names=[],e.skips=[],e.formatters={};},function(t,e){function n(t){if(t=String(t),!(t.length>100)){var e=/^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(t);if(e){var n=parseFloat(e[1]),r=(e[2]||"ms").toLowerCase();switch(r){case"years":case"year":case"yrs":case"yr":case"y":return n*p;case"days":case"day":case"d":return n*u;case"hours":case"hour":case"hrs":case"hr":case"h":return n*c;case"minutes":case"minute":case"mins":case"min":case"m":return n*a;case"seconds":case"second":case"secs":case"sec":case"s":return n*s;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return n;default:return}}}}function r(t){return t>=u?Math.round(t/u)+"d":t>=c?Math.round(t/c)+"h":t>=a?Math.round(t/a)+"m":t>=s?Math.round(t/s)+"s":t+"ms"}function o(t){return i(t,u,"day")||i(t,c,"hour")||i(t,a,"minute")||i(t,s,"second")||t+" ms"}function i(t,e,n){if(!(t<e))return t<1.5*e?Math.floor(t/e)+" "+n:Math.ceil(t/e)+" "+n+"s"}var s=1e3,a=60*s,c=60*a,u=24*c,p=365.25*u;t.exports=function(t,e){e=e||{};var i=typeof t;if("string"===i&&t.length>0)return n(t);if("number"===i&&isNaN(t)===!1)return e["long"]?o(t):r(t);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(t))};},function(t,e,n){function r(t){if(t)return o(t)}function o(t){for(var e in r.prototype)t[e]=r.prototype[e];return t}t.exports=r,r.prototype.on=r.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},r.prototype.once=function(t,e){function n(){this.off(t,n),e.apply(this,arguments);}return n.fn=e,this.on(t,n),this},r.prototype.off=r.prototype.removeListener=r.prototype.removeAllListeners=r.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var n=this._callbacks["$"+t];if(!n)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var r,o=0;o<n.length;o++)if(r=n[o],r===e||r.fn===e){n.splice(o,1);break}return this},r.prototype.emit=function(t){this._callbacks=this._callbacks||{};var e=[].slice.call(arguments,1),n=this._callbacks["$"+t];if(n){n=n.slice(0);for(var r=0,o=n.length;r<o;++r)n[r].apply(this,e);}return this},r.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},r.prototype.hasListeners=function(t){return !!this.listeners(t).length};},function(t,e,n){function r(t,e){if(!t)return t;if(s(t)){var n={_placeholder:!0,num:e.length};return e.push(t),n}if(i(t)){for(var o=new Array(t.length),a=0;a<t.length;a++)o[a]=r(t[a],e);return o}if("object"==typeof t&&!(t instanceof Date)){var o={};for(var c in t)o[c]=r(t[c],e);return o}return t}function o(t,e){if(!t)return t;if(t&&t._placeholder)return e[t.num];if(i(t))for(var n=0;n<t.length;n++)t[n]=o(t[n],e);else if("object"==typeof t)for(var r in t)t[r]=o(t[r],e);return t}var i=n(13),s=n(14),a=Object.prototype.toString,c="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===a.call(Blob),u="function"==typeof File||"undefined"!=typeof File&&"[object FileConstructor]"===a.call(File);e.deconstructPacket=function(t){var e=[],n=t.data,o=t;return o.data=r(n,e),o.attachments=e.length,{packet:o,buffers:e}},e.reconstructPacket=function(t,e){return t.data=o(t.data,e),t.attachments=void 0,t},e.removeBlobs=function(t,e){function n(t,a,p){if(!t)return t;if(c&&t instanceof Blob||u&&t instanceof File){r++;var h=new FileReader;h.onload=function(){p?p[a]=this.result:o=this.result,--r||e(o);},h.readAsArrayBuffer(t);}else if(i(t))for(var f=0;f<t.length;f++)n(t[f],f,t);else if("object"==typeof t&&!s(t))for(var l in t)n(t[l],l,t);}var r=0,o=t;n(o),r||e(o);};},function(t,e){var n={}.toString;t.exports=Array.isArray||function(t){return "[object Array]"==n.call(t)};},function(t,e){function n(t){return r&&Buffer.isBuffer(t)||o&&(t instanceof ArrayBuffer||i(t))}t.exports=n;var r="function"==typeof Buffer&&"function"==typeof Buffer.isBuffer,o="function"==typeof ArrayBuffer,i=function(t){return "function"==typeof ArrayBuffer.isView?ArrayBuffer.isView(t):t.buffer instanceof ArrayBuffer};},function(t,e,n){function r(t,e){if(!(this instanceof r))return new r(t,e);t&&"object"==typeof t&&(e=t,t=void 0),e=e||{},e.path=e.path||"/socket.io",this.nsps={},this.subs=[],this.opts=e,this.reconnection(e.reconnection!==!1),this.reconnectionAttempts(e.reconnectionAttempts||1/0),this.reconnectionDelay(e.reconnectionDelay||1e3),this.reconnectionDelayMax(e.reconnectionDelayMax||5e3),this.randomizationFactor(e.randomizationFactor||.5),this.backoff=new f({min:this.reconnectionDelay(),max:this.reconnectionDelayMax(),jitter:this.randomizationFactor()}),this.timeout(null==e.timeout?2e4:e.timeout),this.readyState="closed",this.uri=t,this.connecting=[],this.lastPing=null,this.encoding=!1,this.packetBuffer=[];var n=e.parser||a;this.encoder=new n.Encoder,this.decoder=new n.Decoder,this.autoConnect=e.autoConnect!==!1,this.autoConnect&&this.open();}var o=n(16),i=n(39),s=n(11),a=n(7),c=n(41),u=n(42),p=n(3)("socket.io-client:manager"),h=n(38),f=n(43),l=Object.prototype.hasOwnProperty;t.exports=r,r.prototype.emitAll=function(){this.emit.apply(this,arguments);for(var t in this.nsps)l.call(this.nsps,t)&&this.nsps[t].emit.apply(this.nsps[t],arguments);},r.prototype.updateSocketIds=function(){for(var t in this.nsps)l.call(this.nsps,t)&&(this.nsps[t].id=this.generateId(t));},r.prototype.generateId=function(t){return ("/"===t?"":t+"#")+this.engine.id},s(r.prototype),r.prototype.reconnection=function(t){return arguments.length?(this._reconnection=!!t,this):this._reconnection},r.prototype.reconnectionAttempts=function(t){return arguments.length?(this._reconnectionAttempts=t,this):this._reconnectionAttempts},r.prototype.reconnectionDelay=function(t){return arguments.length?(this._reconnectionDelay=t,this.backoff&&this.backoff.setMin(t),this):this._reconnectionDelay},r.prototype.randomizationFactor=function(t){return arguments.length?(this._randomizationFactor=t,this.backoff&&this.backoff.setJitter(t),this):this._randomizationFactor},r.prototype.reconnectionDelayMax=function(t){return arguments.length?(this._reconnectionDelayMax=t,this.backoff&&this.backoff.setMax(t),this):this._reconnectionDelayMax},r.prototype.timeout=function(t){return arguments.length?(this._timeout=t,this):this._timeout},r.prototype.maybeReconnectOnOpen=function(){!this.reconnecting&&this._reconnection&&0===this.backoff.attempts&&this.reconnect();},r.prototype.open=r.prototype.connect=function(t,e){if(p("readyState %s",this.readyState),~this.readyState.indexOf("open"))return this;p("opening %s",this.uri),this.engine=o(this.uri,this.opts);var n=this.engine,r=this;this.readyState="opening",this.skipReconnect=!1;var i=c(n,"open",function(){r.onopen(),t&&t();}),s=c(n,"error",function(e){if(p("connect_error"),r.cleanup(),r.readyState="closed",r.emitAll("connect_error",e),t){var n=new Error("Connection error");n.data=e,t(n);}else r.maybeReconnectOnOpen();});if(!1!==this._timeout){var a=this._timeout;p("connect attempt will timeout after %d",a);var u=setTimeout(function(){p("connect attempt timed out after %d",a),i.destroy(),n.close(),n.emit("error","timeout"),r.emitAll("connect_timeout",a);},a);this.subs.push({destroy:function(){clearTimeout(u);}});}return this.subs.push(i),this.subs.push(s),this},r.prototype.onopen=function(){p("open"),this.cleanup(),this.readyState="open",this.emit("open");var t=this.engine;this.subs.push(c(t,"data",u(this,"ondata"))),this.subs.push(c(t,"ping",u(this,"onping"))),this.subs.push(c(t,"pong",u(this,"onpong"))),this.subs.push(c(t,"error",u(this,"onerror"))),this.subs.push(c(t,"close",u(this,"onclose"))),this.subs.push(c(this.decoder,"decoded",u(this,"ondecoded")));},r.prototype.onping=function(){this.lastPing=new Date,this.emitAll("ping");},r.prototype.onpong=function(){this.emitAll("pong",new Date-this.lastPing);},r.prototype.ondata=function(t){this.decoder.add(t);},r.prototype.ondecoded=function(t){this.emit("packet",t);},r.prototype.onerror=function(t){p("error",t),this.emitAll("error",t);},r.prototype.socket=function(t,e){function n(){~h(o.connecting,r)||o.connecting.push(r);}var r=this.nsps[t];if(!r){r=new i(this,t,e),this.nsps[t]=r;var o=this;r.on("connecting",n),r.on("connect",function(){r.id=o.generateId(t);}),this.autoConnect&&n();}return r},r.prototype.destroy=function(t){var e=h(this.connecting,t);~e&&this.connecting.splice(e,1),this.connecting.length||this.close();},r.prototype.packet=function(t){p("writing packet %j",t);var e=this;t.query&&0===t.type&&(t.nsp+="?"+t.query),e.encoding?e.packetBuffer.push(t):(e.encoding=!0,this.encoder.encode(t,function(n){for(var r=0;r<n.length;r++)e.engine.write(n[r],t.options);e.encoding=!1,e.processPacketQueue();}));},r.prototype.processPacketQueue=function(){if(this.packetBuffer.length>0&&!this.encoding){var t=this.packetBuffer.shift();this.packet(t);}},r.prototype.cleanup=function(){p("cleanup");for(var t=this.subs.length,e=0;e<t;e++){var n=this.subs.shift();n.destroy();}this.packetBuffer=[],this.encoding=!1,this.lastPing=null,this.decoder.destroy();},r.prototype.close=r.prototype.disconnect=function(){p("disconnect"),this.skipReconnect=!0,this.reconnecting=!1,"opening"===this.readyState&&this.cleanup(),this.backoff.reset(),this.readyState="closed",this.engine&&this.engine.close();},r.prototype.onclose=function(t){p("onclose"),this.cleanup(),this.backoff.reset(),this.readyState="closed",this.emit("close",t),this._reconnection&&!this.skipReconnect&&this.reconnect();},r.prototype.reconnect=function(){if(this.reconnecting||this.skipReconnect)return this;var t=this;if(this.backoff.attempts>=this._reconnectionAttempts)p("reconnect failed"),this.backoff.reset(),this.emitAll("reconnect_failed"),this.reconnecting=!1;else{var e=this.backoff.duration();p("will wait %dms before reconnect attempt",e),this.reconnecting=!0;var n=setTimeout(function(){t.skipReconnect||(p("attempting reconnect"),t.emitAll("reconnect_attempt",t.backoff.attempts),t.emitAll("reconnecting",t.backoff.attempts),t.skipReconnect||t.open(function(e){e?(p("reconnect attempt error"),t.reconnecting=!1,t.reconnect(),t.emitAll("reconnect_error",e.data)):(p("reconnect success"),t.onreconnect());}));},e);this.subs.push({destroy:function(){clearTimeout(n);}});}},r.prototype.onreconnect=function(){var t=this.backoff.attempts;this.reconnecting=!1,this.backoff.reset(),this.updateSocketIds(),this.emitAll("reconnect",t);};},function(t,e,n){t.exports=n(17),t.exports.parser=n(24);},function(t,e,n){function r(t,e){return this instanceof r?(e=e||{},t&&"object"==typeof t&&(e=t,t=null),t?(t=p(t),e.hostname=t.host,e.secure="https"===t.protocol||"wss"===t.protocol,e.port=t.port,t.query&&(e.query=t.query)):e.host&&(e.hostname=p(e.host).host),this.secure=null!=e.secure?e.secure:"undefined"!=typeof location&&"https:"===location.protocol,e.hostname&&!e.port&&(e.port=this.secure?"443":"80"),this.agent=e.agent||!1,this.hostname=e.hostname||("undefined"!=typeof location?location.hostname:"localhost"),this.port=e.port||("undefined"!=typeof location&&location.port?location.port:this.secure?443:80),this.query=e.query||{},"string"==typeof this.query&&(this.query=h.decode(this.query)),this.upgrade=!1!==e.upgrade,this.path=(e.path||"/engine.io").replace(/\/$/,"")+"/",this.forceJSONP=!!e.forceJSONP,this.jsonp=!1!==e.jsonp,this.forceBase64=!!e.forceBase64,this.enablesXDR=!!e.enablesXDR,this.withCredentials=!1!==e.withCredentials,this.timestampParam=e.timestampParam||"t",this.timestampRequests=e.timestampRequests,this.transports=e.transports||["polling","websocket"],this.transportOptions=e.transportOptions||{},this.readyState="",this.writeBuffer=[],this.prevBufferLen=0,this.policyPort=e.policyPort||843,this.rememberUpgrade=e.rememberUpgrade||!1,this.binaryType=null,this.onlyBinaryUpgrades=e.onlyBinaryUpgrades,this.perMessageDeflate=!1!==e.perMessageDeflate&&(e.perMessageDeflate||{}),!0===this.perMessageDeflate&&(this.perMessageDeflate={}),this.perMessageDeflate&&null==this.perMessageDeflate.threshold&&(this.perMessageDeflate.threshold=1024),this.pfx=e.pfx||null,this.key=e.key||null,this.passphrase=e.passphrase||null,this.cert=e.cert||null,this.ca=e.ca||null,this.ciphers=e.ciphers||null,this.rejectUnauthorized=void 0===e.rejectUnauthorized||e.rejectUnauthorized,this.forceNode=!!e.forceNode,this.isReactNative="undefined"!=typeof navigator&&"string"==typeof navigator.product&&"reactnative"===navigator.product.toLowerCase(),("undefined"==typeof self||this.isReactNative)&&(e.extraHeaders&&Object.keys(e.extraHeaders).length>0&&(this.extraHeaders=e.extraHeaders),e.localAddress&&(this.localAddress=e.localAddress)),this.id=null,this.upgrades=null,this.pingInterval=null,this.pingTimeout=null,this.pingIntervalTimer=null,this.pingTimeoutTimer=null,void this.open()):new r(t,e)}function o(t){var e={};for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}var i=n(18),s=n(11),a=n(3)("engine.io-client:socket"),c=n(38),u=n(24),p=n(2),h=n(32);t.exports=r,r.priorWebsocketSuccess=!1,s(r.prototype),r.protocol=u.protocol,r.Socket=r,r.Transport=n(23),r.transports=n(18),r.parser=n(24),r.prototype.createTransport=function(t){a('creating transport "%s"',t);var e=o(this.query);e.EIO=u.protocol,e.transport=t;var n=this.transportOptions[t]||{};this.id&&(e.sid=this.id);var r=new i[t]({query:e,socket:this,agent:n.agent||this.agent,hostname:n.hostname||this.hostname,port:n.port||this.port,secure:n.secure||this.secure,path:n.path||this.path,forceJSONP:n.forceJSONP||this.forceJSONP,jsonp:n.jsonp||this.jsonp,forceBase64:n.forceBase64||this.forceBase64,enablesXDR:n.enablesXDR||this.enablesXDR,withCredentials:n.withCredentials||this.withCredentials,timestampRequests:n.timestampRequests||this.timestampRequests,timestampParam:n.timestampParam||this.timestampParam,policyPort:n.policyPort||this.policyPort,pfx:n.pfx||this.pfx,key:n.key||this.key,passphrase:n.passphrase||this.passphrase,cert:n.cert||this.cert,ca:n.ca||this.ca,ciphers:n.ciphers||this.ciphers,rejectUnauthorized:n.rejectUnauthorized||this.rejectUnauthorized,perMessageDeflate:n.perMessageDeflate||this.perMessageDeflate,extraHeaders:n.extraHeaders||this.extraHeaders,forceNode:n.forceNode||this.forceNode,localAddress:n.localAddress||this.localAddress,requestTimeout:n.requestTimeout||this.requestTimeout,protocols:n.protocols||void 0,isReactNative:this.isReactNative});return r},r.prototype.open=function(){var t;if(this.rememberUpgrade&&r.priorWebsocketSuccess&&this.transports.indexOf("websocket")!==-1)t="websocket";else{
    if(0===this.transports.length){var e=this;return void setTimeout(function(){e.emit("error","No transports available");},0)}t=this.transports[0];}this.readyState="opening";try{t=this.createTransport(t);}catch(n){return this.transports.shift(),void this.open()}t.open(),this.setTransport(t);},r.prototype.setTransport=function(t){a("setting transport %s",t.name);var e=this;this.transport&&(a("clearing existing transport %s",this.transport.name),this.transport.removeAllListeners()),this.transport=t,t.on("drain",function(){e.onDrain();}).on("packet",function(t){e.onPacket(t);}).on("error",function(t){e.onError(t);}).on("close",function(){e.onClose("transport close");});},r.prototype.probe=function(t){function e(){if(f.onlyBinaryUpgrades){var e=!this.supportsBinary&&f.transport.supportsBinary;h=h||e;}h||(a('probe transport "%s" opened',t),p.send([{type:"ping",data:"probe"}]),p.once("packet",function(e){if(!h)if("pong"===e.type&&"probe"===e.data){if(a('probe transport "%s" pong',t),f.upgrading=!0,f.emit("upgrading",p),!p)return;r.priorWebsocketSuccess="websocket"===p.name,a('pausing current transport "%s"',f.transport.name),f.transport.pause(function(){h||"closed"!==f.readyState&&(a("changing transport and sending upgrade packet"),u(),f.setTransport(p),p.send([{type:"upgrade"}]),f.emit("upgrade",p),p=null,f.upgrading=!1,f.flush());});}else{a('probe transport "%s" failed',t);var n=new Error("probe error");n.transport=p.name,f.emit("upgradeError",n);}}));}function n(){h||(h=!0,u(),p.close(),p=null);}function o(e){var r=new Error("probe error: "+e);r.transport=p.name,n(),a('probe transport "%s" failed because of error: %s',t,e),f.emit("upgradeError",r);}function i(){o("transport closed");}function s(){o("socket closed");}function c(t){p&&t.name!==p.name&&(a('"%s" works - aborting "%s"',t.name,p.name),n());}function u(){p.removeListener("open",e),p.removeListener("error",o),p.removeListener("close",i),f.removeListener("close",s),f.removeListener("upgrading",c);}a('probing transport "%s"',t);var p=this.createTransport(t,{probe:1}),h=!1,f=this;r.priorWebsocketSuccess=!1,p.once("open",e),p.once("error",o),p.once("close",i),this.once("close",s),this.once("upgrading",c),p.open();},r.prototype.onOpen=function(){if(a("socket open"),this.readyState="open",r.priorWebsocketSuccess="websocket"===this.transport.name,this.emit("open"),this.flush(),"open"===this.readyState&&this.upgrade&&this.transport.pause){a("starting upgrade probes");for(var t=0,e=this.upgrades.length;t<e;t++)this.probe(this.upgrades[t]);}},r.prototype.onPacket=function(t){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState)switch(a('socket receive: type "%s", data "%s"',t.type,t.data),this.emit("packet",t),this.emit("heartbeat"),t.type){case"open":this.onHandshake(JSON.parse(t.data));break;case"pong":this.setPing(),this.emit("pong");break;case"error":var e=new Error("server error");e.code=t.data,this.onError(e);break;case"message":this.emit("data",t.data),this.emit("message",t.data);}else a('packet received with socket readyState "%s"',this.readyState);},r.prototype.onHandshake=function(t){this.emit("handshake",t),this.id=t.sid,this.transport.query.sid=t.sid,this.upgrades=this.filterUpgrades(t.upgrades),this.pingInterval=t.pingInterval,this.pingTimeout=t.pingTimeout,this.onOpen(),"closed"!==this.readyState&&(this.setPing(),this.removeListener("heartbeat",this.onHeartbeat),this.on("heartbeat",this.onHeartbeat));},r.prototype.onHeartbeat=function(t){clearTimeout(this.pingTimeoutTimer);var e=this;e.pingTimeoutTimer=setTimeout(function(){"closed"!==e.readyState&&e.onClose("ping timeout");},t||e.pingInterval+e.pingTimeout);},r.prototype.setPing=function(){var t=this;clearTimeout(t.pingIntervalTimer),t.pingIntervalTimer=setTimeout(function(){a("writing ping packet - expecting pong within %sms",t.pingTimeout),t.ping(),t.onHeartbeat(t.pingTimeout);},t.pingInterval);},r.prototype.ping=function(){var t=this;this.sendPacket("ping",function(){t.emit("ping");});},r.prototype.onDrain=function(){this.writeBuffer.splice(0,this.prevBufferLen),this.prevBufferLen=0,0===this.writeBuffer.length?this.emit("drain"):this.flush();},r.prototype.flush=function(){"closed"!==this.readyState&&this.transport.writable&&!this.upgrading&&this.writeBuffer.length&&(a("flushing %d packets in socket",this.writeBuffer.length),this.transport.send(this.writeBuffer),this.prevBufferLen=this.writeBuffer.length,this.emit("flush"));},r.prototype.write=r.prototype.send=function(t,e,n){return this.sendPacket("message",t,e,n),this},r.prototype.sendPacket=function(t,e,n,r){if("function"==typeof e&&(r=e,e=void 0),"function"==typeof n&&(r=n,n=null),"closing"!==this.readyState&&"closed"!==this.readyState){n=n||{},n.compress=!1!==n.compress;var o={type:t,data:e,options:n};this.emit("packetCreate",o),this.writeBuffer.push(o),r&&this.once("flush",r),this.flush();}},r.prototype.close=function(){function t(){r.onClose("forced close"),a("socket closing - telling transport to close"),r.transport.close();}function e(){r.removeListener("upgrade",e),r.removeListener("upgradeError",e),t();}function n(){r.once("upgrade",e),r.once("upgradeError",e);}if("opening"===this.readyState||"open"===this.readyState){this.readyState="closing";var r=this;this.writeBuffer.length?this.once("drain",function(){this.upgrading?n():t();}):this.upgrading?n():t();}return this},r.prototype.onError=function(t){a("socket error %j",t),r.priorWebsocketSuccess=!1,this.emit("error",t),this.onClose("transport error",t);},r.prototype.onClose=function(t,e){if("opening"===this.readyState||"open"===this.readyState||"closing"===this.readyState){a('socket close with reason: "%s"',t);var n=this;clearTimeout(this.pingIntervalTimer),clearTimeout(this.pingTimeoutTimer),this.transport.removeAllListeners("close"),this.transport.close(),this.transport.removeAllListeners(),this.readyState="closed",this.id=null,this.emit("close",t,e),n.writeBuffer=[],n.prevBufferLen=0;}},r.prototype.filterUpgrades=function(t){for(var e=[],n=0,r=t.length;n<r;n++)~c(this.transports,t[n])&&e.push(t[n]);return e};},function(t,e,n){function r(t){var e,n=!1,r=!1,a=!1!==t.jsonp;if("undefined"!=typeof location){var c="https:"===location.protocol,u=location.port;u||(u=c?443:80),n=t.hostname!==location.hostname||u!==t.port,r=t.secure!==c;}if(t.xdomain=n,t.xscheme=r,e=new o(t),"open"in e&&!t.forceJSONP)return new i(t);if(!a)throw new Error("JSONP disabled");return new s(t)}var o=n(19),i=n(21),s=n(35),a=n(36);e.polling=r,e.websocket=a;},function(t,e,n){var r=n(20);t.exports=function(t){var e=t.xdomain,n=t.xscheme,o=t.enablesXDR;try{if("undefined"!=typeof XMLHttpRequest&&(!e||r))return new XMLHttpRequest}catch(i){}try{if("undefined"!=typeof XDomainRequest&&!n&&o)return new XDomainRequest}catch(i){}if(!e)try{return new(self[["Active"].concat("Object").join("X")])("Microsoft.XMLHTTP")}catch(i){}};},function(t,e){try{t.exports="undefined"!=typeof XMLHttpRequest&&"withCredentials"in new XMLHttpRequest;}catch(n){t.exports=!1;}},function(t,e,n){function r(){}function o(t){if(c.call(this,t),this.requestTimeout=t.requestTimeout,this.extraHeaders=t.extraHeaders,"undefined"!=typeof location){var e="https:"===location.protocol,n=location.port;n||(n=e?443:80),this.xd="undefined"!=typeof location&&t.hostname!==location.hostname||n!==t.port,this.xs=t.secure!==e;}}function i(t){this.method=t.method||"GET",this.uri=t.uri,this.xd=!!t.xd,this.xs=!!t.xs,this.async=!1!==t.async,this.data=void 0!==t.data?t.data:null,this.agent=t.agent,this.isBinary=t.isBinary,this.supportsBinary=t.supportsBinary,this.enablesXDR=t.enablesXDR,this.withCredentials=t.withCredentials,this.requestTimeout=t.requestTimeout,this.pfx=t.pfx,this.key=t.key,this.passphrase=t.passphrase,this.cert=t.cert,this.ca=t.ca,this.ciphers=t.ciphers,this.rejectUnauthorized=t.rejectUnauthorized,this.extraHeaders=t.extraHeaders,this.create();}function s(){for(var t in i.requests)i.requests.hasOwnProperty(t)&&i.requests[t].abort();}var a=n(19),c=n(22),u=n(11),p=n(33),h=n(3)("engine.io-client:polling-xhr");if(t.exports=o,t.exports.Request=i,p(o,c),o.prototype.supportsBinary=!0,o.prototype.request=function(t){return t=t||{},t.uri=this.uri(),t.xd=this.xd,t.xs=this.xs,t.agent=this.agent||!1,t.supportsBinary=this.supportsBinary,t.enablesXDR=this.enablesXDR,t.withCredentials=this.withCredentials,t.pfx=this.pfx,t.key=this.key,t.passphrase=this.passphrase,t.cert=this.cert,t.ca=this.ca,t.ciphers=this.ciphers,t.rejectUnauthorized=this.rejectUnauthorized,t.requestTimeout=this.requestTimeout,t.extraHeaders=this.extraHeaders,new i(t)},o.prototype.doWrite=function(t,e){var n="string"!=typeof t&&void 0!==t,r=this.request({method:"POST",data:t,isBinary:n}),o=this;r.on("success",e),r.on("error",function(t){o.onError("xhr post error",t);}),this.sendXhr=r;},o.prototype.doPoll=function(){h("xhr poll");var t=this.request(),e=this;t.on("data",function(t){e.onData(t);}),t.on("error",function(t){e.onError("xhr poll error",t);}),this.pollXhr=t;},u(i.prototype),i.prototype.create=function(){var t={agent:this.agent,xdomain:this.xd,xscheme:this.xs,enablesXDR:this.enablesXDR};t.pfx=this.pfx,t.key=this.key,t.passphrase=this.passphrase,t.cert=this.cert,t.ca=this.ca,t.ciphers=this.ciphers,t.rejectUnauthorized=this.rejectUnauthorized;var e=this.xhr=new a(t),n=this;try{h("xhr open %s: %s",this.method,this.uri),e.open(this.method,this.uri,this.async);try{if(this.extraHeaders){e.setDisableHeaderCheck&&e.setDisableHeaderCheck(!0);for(var r in this.extraHeaders)this.extraHeaders.hasOwnProperty(r)&&e.setRequestHeader(r,this.extraHeaders[r]);}}catch(o){}if("POST"===this.method)try{this.isBinary?e.setRequestHeader("Content-type","application/octet-stream"):e.setRequestHeader("Content-type","text/plain;charset=UTF-8");}catch(o){}try{e.setRequestHeader("Accept","*/*");}catch(o){}"withCredentials"in e&&(e.withCredentials=this.withCredentials),this.requestTimeout&&(e.timeout=this.requestTimeout),this.hasXDR()?(e.onload=function(){n.onLoad();},e.onerror=function(){n.onError(e.responseText);}):e.onreadystatechange=function(){if(2===e.readyState)try{var t=e.getResponseHeader("Content-Type");(n.supportsBinary&&"application/octet-stream"===t||"application/octet-stream; charset=UTF-8"===t)&&(e.responseType="arraybuffer");}catch(r){}4===e.readyState&&(200===e.status||1223===e.status?n.onLoad():setTimeout(function(){n.onError("number"==typeof e.status?e.status:0);},0));},h("xhr data %s",this.data),e.send(this.data);}catch(o){return void setTimeout(function(){n.onError(o);},0)}"undefined"!=typeof document&&(this.index=i.requestsCount++,i.requests[this.index]=this);},i.prototype.onSuccess=function(){this.emit("success"),this.cleanup();},i.prototype.onData=function(t){this.emit("data",t),this.onSuccess();},i.prototype.onError=function(t){this.emit("error",t),this.cleanup(!0);},i.prototype.cleanup=function(t){if("undefined"!=typeof this.xhr&&null!==this.xhr){if(this.hasXDR()?this.xhr.onload=this.xhr.onerror=r:this.xhr.onreadystatechange=r,t)try{this.xhr.abort();}catch(e){}"undefined"!=typeof document&&delete i.requests[this.index],this.xhr=null;}},i.prototype.onLoad=function(){var t;try{var e;try{e=this.xhr.getResponseHeader("Content-Type");}catch(n){}t="application/octet-stream"===e||"application/octet-stream; charset=UTF-8"===e?this.xhr.response||this.xhr.responseText:this.xhr.responseText;}catch(n){this.onError(n);}null!=t&&this.onData(t);},i.prototype.hasXDR=function(){return "undefined"!=typeof XDomainRequest&&!this.xs&&this.enablesXDR},i.prototype.abort=function(){this.cleanup();},i.requestsCount=0,i.requests={},"undefined"!=typeof document)if("function"==typeof attachEvent)attachEvent("onunload",s);else if("function"==typeof addEventListener){var f="onpagehide"in self?"pagehide":"unload";addEventListener(f,s,!1);}},function(t,e,n){function r(t){var e=t&&t.forceBase64;p&&!e||(this.supportsBinary=!1),o.call(this,t);}var o=n(23),i=n(32),s=n(24),a=n(33),c=n(34),u=n(3)("engine.io-client:polling");t.exports=r;var p=function(){var t=n(19),e=new t({xdomain:!1});return null!=e.responseType}();a(r,o),r.prototype.name="polling",r.prototype.doOpen=function(){this.poll();},r.prototype.pause=function(t){function e(){u("paused"),n.readyState="paused",t();}var n=this;if(this.readyState="pausing",this.polling||!this.writable){var r=0;this.polling&&(u("we are currently polling - waiting to pause"),r++,this.once("pollComplete",function(){u("pre-pause polling complete"),--r||e();})),this.writable||(u("we are currently writing - waiting to pause"),r++,this.once("drain",function(){u("pre-pause writing complete"),--r||e();}));}else e();},r.prototype.poll=function(){u("polling"),this.polling=!0,this.doPoll(),this.emit("poll");},r.prototype.onData=function(t){var e=this;u("polling got data %s",t);var n=function(t,n,r){return "opening"===e.readyState&&e.onOpen(),"close"===t.type?(e.onClose(),!1):void e.onPacket(t)};s.decodePayload(t,this.socket.binaryType,n),"closed"!==this.readyState&&(this.polling=!1,this.emit("pollComplete"),"open"===this.readyState?this.poll():u('ignoring poll - transport state "%s"',this.readyState));},r.prototype.doClose=function(){function t(){u("writing close packet"),e.write([{type:"close"}]);}var e=this;"open"===this.readyState?(u("transport open - closing"),t()):(u("transport not open - deferring close"),this.once("open",t));},r.prototype.write=function(t){var e=this;this.writable=!1;var n=function(){e.writable=!0,e.emit("drain");};s.encodePayload(t,this.supportsBinary,function(t){e.doWrite(t,n);});},r.prototype.uri=function(){var t=this.query||{},e=this.secure?"https":"http",n="";!1!==this.timestampRequests&&(t[this.timestampParam]=c()),this.supportsBinary||t.sid||(t.b64=1),t=i.encode(t),this.port&&("https"===e&&443!==Number(this.port)||"http"===e&&80!==Number(this.port))&&(n=":"+this.port),t.length&&(t="?"+t);var r=this.hostname.indexOf(":")!==-1;return e+"://"+(r?"["+this.hostname+"]":this.hostname)+n+this.path+t};},function(t,e,n){function r(t){this.path=t.path,this.hostname=t.hostname,this.port=t.port,this.secure=t.secure,this.query=t.query,this.timestampParam=t.timestampParam,this.timestampRequests=t.timestampRequests,this.readyState="",this.agent=t.agent||!1,this.socket=t.socket,this.enablesXDR=t.enablesXDR,this.withCredentials=t.withCredentials,this.pfx=t.pfx,this.key=t.key,this.passphrase=t.passphrase,this.cert=t.cert,this.ca=t.ca,this.ciphers=t.ciphers,this.rejectUnauthorized=t.rejectUnauthorized,this.forceNode=t.forceNode,this.isReactNative=t.isReactNative,this.extraHeaders=t.extraHeaders,this.localAddress=t.localAddress;}var o=n(24),i=n(11);t.exports=r,i(r.prototype),r.prototype.onError=function(t,e){var n=new Error(t);return n.type="TransportError",n.description=e,this.emit("error",n),this},r.prototype.open=function(){return "closed"!==this.readyState&&""!==this.readyState||(this.readyState="opening",this.doOpen()),this},r.prototype.close=function(){return "opening"!==this.readyState&&"open"!==this.readyState||(this.doClose(),this.onClose()),this},r.prototype.send=function(t){if("open"!==this.readyState)throw new Error("Transport not open");this.write(t);},r.prototype.onOpen=function(){this.readyState="open",this.writable=!0,this.emit("open");},r.prototype.onData=function(t){var e=o.decodePacket(t,this.socket.binaryType);this.onPacket(e);},r.prototype.onPacket=function(t){this.emit("packet",t);},r.prototype.onClose=function(){this.readyState="closed",this.emit("close");};},function(t,e,n){function r(t,n){var r="b"+e.packets[t.type]+t.data.data;return n(r)}function o(t,n,r){if(!n)return e.encodeBase64Packet(t,r);var o=t.data,i=new Uint8Array(o),s=new Uint8Array(1+o.byteLength);s[0]=v[t.type];for(var a=0;a<i.length;a++)s[a+1]=i[a];return r(s.buffer)}function i(t,n,r){if(!n)return e.encodeBase64Packet(t,r);var o=new FileReader;return o.onload=function(){e.encodePacket({type:t.type,data:o.result},n,!0,r);},o.readAsArrayBuffer(t.data)}function s(t,n,r){if(!n)return e.encodeBase64Packet(t,r);if(g)return i(t,n,r);var o=new Uint8Array(1);o[0]=v[t.type];var s=new w([o.buffer,t.data]);return r(s)}function a(t){try{t=d.decode(t,{strict:!1});}catch(e){return !1}return t}function c(t,e,n){for(var r=new Array(t.length),o=l(t.length,n),i=function(t,n,o){e(n,function(e,n){r[t]=n,o(e,r);});},s=0;s<t.length;s++)i(s,t[s],o);}var u,p=n(25),h=n(26),f=n(27),l=n(28),d=n(29);"undefined"!=typeof ArrayBuffer&&(u=n(30));var y="undefined"!=typeof navigator&&/Android/i.test(navigator.userAgent),m="undefined"!=typeof navigator&&/PhantomJS/i.test(navigator.userAgent),g=y||m;e.protocol=3;var v=e.packets={open:0,close:1,ping:2,pong:3,message:4,upgrade:5,noop:6},b=p(v),C={type:"error",data:"parser error"},w=n(31);e.encodePacket=function(t,e,n,i){"function"==typeof e&&(i=e,e=!1),"function"==typeof n&&(i=n,n=null);var a=void 0===t.data?void 0:t.data.buffer||t.data;if("undefined"!=typeof ArrayBuffer&&a instanceof ArrayBuffer)return o(t,e,i);if("undefined"!=typeof w&&a instanceof w)return s(t,e,i);if(a&&a.base64)return r(t,i);var c=v[t.type];return void 0!==t.data&&(c+=n?d.encode(String(t.data),{strict:!1}):String(t.data)),i(""+c)},e.encodeBase64Packet=function(t,n){var r="b"+e.packets[t.type];if("undefined"!=typeof w&&t.data instanceof w){var o=new FileReader;return o.onload=function(){var t=o.result.split(",")[1];n(r+t);},o.readAsDataURL(t.data)}var i;try{i=String.fromCharCode.apply(null,new Uint8Array(t.data));}catch(s){for(var a=new Uint8Array(t.data),c=new Array(a.length),u=0;u<a.length;u++)c[u]=a[u];i=String.fromCharCode.apply(null,c);}return r+=btoa(i),n(r)},e.decodePacket=function(t,n,r){if(void 0===t)return C;if("string"==typeof t){if("b"===t.charAt(0))return e.decodeBase64Packet(t.substr(1),n);if(r&&(t=a(t),t===!1))return C;var o=t.charAt(0);return Number(o)==o&&b[o]?t.length>1?{type:b[o],data:t.substring(1)}:{type:b[o]}:C}var i=new Uint8Array(t),o=i[0],s=f(t,1);return w&&"blob"===n&&(s=new w([s])),{type:b[o],data:s}},e.decodeBase64Packet=function(t,e){var n=b[t.charAt(0)];if(!u)return {type:n,data:{base64:!0,data:t.substr(1)}};var r=u.decode(t.substr(1));return "blob"===e&&w&&(r=new w([r])),{type:n,data:r}},e.encodePayload=function(t,n,r){function o(t){return t.length+":"+t}function i(t,r){e.encodePacket(t,!!s&&n,!1,function(t){r(null,o(t));});}"function"==typeof n&&(r=n,n=null);var s=h(t);return n&&s?w&&!g?e.encodePayloadAsBlob(t,r):e.encodePayloadAsArrayBuffer(t,r):t.length?void c(t,i,function(t,e){return r(e.join(""))}):r("0:")},e.decodePayload=function(t,n,r){if("string"!=typeof t)return e.decodePayloadAsBinary(t,n,r);"function"==typeof n&&(r=n,n=null);var o;if(""===t)return r(C,0,1);for(var i,s,a="",c=0,u=t.length;c<u;c++){var p=t.charAt(c);if(":"===p){if(""===a||a!=(i=Number(a)))return r(C,0,1);if(s=t.substr(c+1,i),a!=s.length)return r(C,0,1);if(s.length){if(o=e.decodePacket(s,n,!1),C.type===o.type&&C.data===o.data)return r(C,0,1);var h=r(o,c+i,u);if(!1===h)return}c+=i,a="";}else a+=p;}return ""!==a?r(C,0,1):void 0},e.encodePayloadAsArrayBuffer=function(t,n){function r(t,n){e.encodePacket(t,!0,!0,function(t){return n(null,t)});}return t.length?void c(t,r,function(t,e){var r=e.reduce(function(t,e){var n;return n="string"==typeof e?e.length:e.byteLength,t+n.toString().length+n+2},0),o=new Uint8Array(r),i=0;return e.forEach(function(t){var e="string"==typeof t,n=t;if(e){for(var r=new Uint8Array(t.length),s=0;s<t.length;s++)r[s]=t.charCodeAt(s);n=r.buffer;}e?o[i++]=0:o[i++]=1;for(var a=n.byteLength.toString(),s=0;s<a.length;s++)o[i++]=parseInt(a[s]);o[i++]=255;for(var r=new Uint8Array(n),s=0;s<r.length;s++)o[i++]=r[s];}),n(o.buffer)}):n(new ArrayBuffer(0))},e.encodePayloadAsBlob=function(t,n){function r(t,n){e.encodePacket(t,!0,!0,function(t){var e=new Uint8Array(1);if(e[0]=1,"string"==typeof t){for(var r=new Uint8Array(t.length),o=0;o<t.length;o++)r[o]=t.charCodeAt(o);t=r.buffer,e[0]=0;}for(var i=t instanceof ArrayBuffer?t.byteLength:t.size,s=i.toString(),a=new Uint8Array(s.length+1),o=0;o<s.length;o++)a[o]=parseInt(s[o]);if(a[s.length]=255,w){var c=new w([e.buffer,a.buffer,t]);n(null,c);}});}c(t,r,function(t,e){return n(new w(e))});},e.decodePayloadAsBinary=function(t,n,r){"function"==typeof n&&(r=n,n=null);for(var o=t,i=[];o.byteLength>0;){for(var s=new Uint8Array(o),a=0===s[0],c="",u=1;255!==s[u];u++){if(c.length>310)return r(C,0,1);c+=s[u];}o=f(o,2+c.length),c=parseInt(c);var p=f(o,0,c);if(a)try{p=String.fromCharCode.apply(null,new Uint8Array(p));}catch(h){var l=new Uint8Array(p);p="";for(var u=0;u<l.length;u++)p+=String.fromCharCode(l[u]);}i.push(p),o=f(o,c);}var d=i.length;i.forEach(function(t,o){r(e.decodePacket(t,n,!0),o,d);});};},function(t,e){t.exports=Object.keys||function(t){var e=[],n=Object.prototype.hasOwnProperty;for(var r in t)n.call(t,r)&&e.push(r);return e};},function(t,e,n){function r(t){if(!t||"object"!=typeof t)return !1;if(o(t)){for(var e=0,n=t.length;e<n;e++)if(r(t[e]))return !0;return !1}if("function"==typeof Buffer&&Buffer.isBuffer&&Buffer.isBuffer(t)||"function"==typeof ArrayBuffer&&t instanceof ArrayBuffer||s&&t instanceof Blob||a&&t instanceof File)return !0;if(t.toJSON&&"function"==typeof t.toJSON&&1===arguments.length)return r(t.toJSON(),!0);for(var i in t)if(Object.prototype.hasOwnProperty.call(t,i)&&r(t[i]))return !0;return !1}var o=n(13),i=Object.prototype.toString,s="function"==typeof Blob||"undefined"!=typeof Blob&&"[object BlobConstructor]"===i.call(Blob),a="function"==typeof File||"undefined"!=typeof File&&"[object FileConstructor]"===i.call(File);t.exports=r;},function(t,e){t.exports=function(t,e,n){var r=t.byteLength;if(e=e||0,n=n||r,t.slice)return t.slice(e,n);if(e<0&&(e+=r),n<0&&(n+=r),n>r&&(n=r),e>=r||e>=n||0===r)return new ArrayBuffer(0);for(var o=new Uint8Array(t),i=new Uint8Array(n-e),s=e,a=0;s<n;s++,a++)i[a]=o[s];return i.buffer};},function(t,e){function n(t,e,n){function o(t,r){if(o.count<=0)throw new Error("after called too many times");--o.count,t?(i=!0,e(t),e=n):0!==o.count||i||e(null,r);}var i=!1;return n=n||r,o.count=t,0===t?e():o}function r(){}t.exports=n;},function(t,e){function n(t){for(var e,n,r=[],o=0,i=t.length;o<i;)e=t.charCodeAt(o++),e>=55296&&e<=56319&&o<i?(n=t.charCodeAt(o++),56320==(64512&n)?r.push(((1023&e)<<10)+(1023&n)+65536):(r.push(e),o--)):r.push(e);return r}function r(t){for(var e,n=t.length,r=-1,o="";++r<n;)e=t[r],e>65535&&(e-=65536,o+=d(e>>>10&1023|55296),e=56320|1023&e),o+=d(e);return o}function o(t,e){if(t>=55296&&t<=57343){if(e)throw Error("Lone surrogate U+"+t.toString(16).toUpperCase()+" is not a scalar value");return !1}return !0}function i(t,e){return d(t>>e&63|128)}function s(t,e){if(0==(4294967168&t))return d(t);var n="";return 0==(4294965248&t)?n=d(t>>6&31|192):0==(4294901760&t)?(o(t,e)||(t=65533),n=d(t>>12&15|224),n+=i(t,6)):0==(4292870144&t)&&(n=d(t>>18&7|240),n+=i(t,12),n+=i(t,6)),n+=d(63&t|128)}function a(t,e){e=e||{};for(var r,o=!1!==e.strict,i=n(t),a=i.length,c=-1,u="";++c<a;)r=i[c],u+=s(r,o);return u}function c(){if(l>=f)throw Error("Invalid byte index");var t=255&h[l];if(l++,128==(192&t))return 63&t;throw Error("Invalid continuation byte")}function u(t){var e,n,r,i,s;if(l>f)throw Error("Invalid byte index");if(l==f)return !1;if(e=255&h[l],l++,0==(128&e))return e;if(192==(224&e)){if(n=c(),s=(31&e)<<6|n,s>=128)return s;throw Error("Invalid continuation byte")}if(224==(240&e)){if(n=c(),r=c(),s=(15&e)<<12|n<<6|r,s>=2048)return o(s,t)?s:65533;throw Error("Invalid continuation byte")}if(240==(248&e)&&(n=c(),r=c(),i=c(),s=(7&e)<<18|n<<12|r<<6|i,s>=65536&&s<=1114111))return s;throw Error("Invalid UTF-8 detected")}function p(t,e){e=e||{};var o=!1!==e.strict;h=n(t),f=h.length,l=0;for(var i,s=[];(i=u(o))!==!1;)s.push(i);return r(s)}/*! https://mths.be/utf8js v2.1.2 by @mathias */
    var h,f,l,d=String.fromCharCode;t.exports={version:"2.1.2",encode:a,decode:p};},function(t,e){!function(){for(var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",n=new Uint8Array(256),r=0;r<t.length;r++)n[t.charCodeAt(r)]=r;e.encode=function(e){var n,r=new Uint8Array(e),o=r.length,i="";for(n=0;n<o;n+=3)i+=t[r[n]>>2],i+=t[(3&r[n])<<4|r[n+1]>>4],i+=t[(15&r[n+1])<<2|r[n+2]>>6],i+=t[63&r[n+2]];return o%3===2?i=i.substring(0,i.length-1)+"=":o%3===1&&(i=i.substring(0,i.length-2)+"=="),i},e.decode=function(t){var e,r,o,i,s,a=.75*t.length,c=t.length,u=0;"="===t[t.length-1]&&(a--,"="===t[t.length-2]&&a--);var p=new ArrayBuffer(a),h=new Uint8Array(p);for(e=0;e<c;e+=4)r=n[t.charCodeAt(e)],o=n[t.charCodeAt(e+1)],i=n[t.charCodeAt(e+2)],s=n[t.charCodeAt(e+3)],h[u++]=r<<2|o>>4,h[u++]=(15&o)<<4|i>>2,h[u++]=(3&i)<<6|63&s;return p};}();},function(t,e){function n(t){return t.map(function(t){if(t.buffer instanceof ArrayBuffer){var e=t.buffer;if(t.byteLength!==e.byteLength){var n=new Uint8Array(t.byteLength);n.set(new Uint8Array(e,t.byteOffset,t.byteLength)),e=n.buffer;}return e}return t})}function r(t,e){e=e||{};var r=new i;return n(t).forEach(function(t){r.append(t);}),e.type?r.getBlob(e.type):r.getBlob()}function o(t,e){return new Blob(n(t),e||{})}var i="undefined"!=typeof i?i:"undefined"!=typeof WebKitBlobBuilder?WebKitBlobBuilder:"undefined"!=typeof MSBlobBuilder?MSBlobBuilder:"undefined"!=typeof MozBlobBuilder&&MozBlobBuilder,s=function(){try{var t=new Blob(["hi"]);return 2===t.size}catch(e){return !1}}(),a=s&&function(){try{var t=new Blob([new Uint8Array([1,2])]);return 2===t.size}catch(e){return !1}}(),c=i&&i.prototype.append&&i.prototype.getBlob;"undefined"!=typeof Blob&&(r.prototype=Blob.prototype,o.prototype=Blob.prototype),t.exports=function(){return s?a?Blob:o:c?r:void 0}();},function(t,e){e.encode=function(t){var e="";for(var n in t)t.hasOwnProperty(n)&&(e.length&&(e+="&"),e+=encodeURIComponent(n)+"="+encodeURIComponent(t[n]));return e},e.decode=function(t){for(var e={},n=t.split("&"),r=0,o=n.length;r<o;r++){var i=n[r].split("=");e[decodeURIComponent(i[0])]=decodeURIComponent(i[1]);}return e};},function(t,e){t.exports=function(t,e){var n=function(){};n.prototype=e.prototype,t.prototype=new n,t.prototype.constructor=t;};},function(t,e){function n(t){var e="";do e=s[t%a]+e,t=Math.floor(t/a);while(t>0);return e}function r(t){var e=0;for(p=0;p<t.length;p++)e=e*a+c[t.charAt(p)];return e}function o(){var t=n(+new Date);return t!==i?(u=0,i=t):t+"."+n(u++)}for(var i,s="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),a=64,c={},u=0,p=0;p<a;p++)c[s[p]]=p;o.encode=n,o.decode=r,t.exports=o;},function(t,e,n){(function(e){function r(){}function o(){return "undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof e?e:{}}function i(t){if(s.call(this,t),this.query=this.query||{},!c){var e=o();c=e.___eio=e.___eio||[];}this.index=c.length;var n=this;c.push(function(t){n.onData(t);}),this.query.j=this.index,"function"==typeof addEventListener&&addEventListener("beforeunload",function(){n.script&&(n.script.onerror=r);},!1);}var s=n(22),a=n(33);t.exports=i;var c,u=/\n/g,p=/\\n/g;a(i,s),i.prototype.supportsBinary=!1,i.prototype.doClose=function(){this.script&&(this.script.parentNode.removeChild(this.script),this.script=null),this.form&&(this.form.parentNode.removeChild(this.form),this.form=null,this.iframe=null),s.prototype.doClose.call(this);},i.prototype.doPoll=function(){var t=this,e=document.createElement("script");this.script&&(this.script.parentNode.removeChild(this.script),this.script=null),e.async=!0,e.src=this.uri(),e.onerror=function(e){t.onError("jsonp poll error",e);};var n=document.getElementsByTagName("script")[0];n?n.parentNode.insertBefore(e,n):(document.head||document.body).appendChild(e),this.script=e;var r="undefined"!=typeof navigator&&/gecko/i.test(navigator.userAgent);r&&setTimeout(function(){var t=document.createElement("iframe");document.body.appendChild(t),document.body.removeChild(t);},100);},i.prototype.doWrite=function(t,e){function n(){r(),e();}function r(){if(o.iframe)try{o.form.removeChild(o.iframe);}catch(t){o.onError("jsonp polling iframe removal error",t);}try{var e='<iframe src="javascript:0" name="'+o.iframeId+'">';i=document.createElement(e);}catch(t){i=document.createElement("iframe"),i.name=o.iframeId,i.src="javascript:0";}i.id=o.iframeId,o.form.appendChild(i),o.iframe=i;}var o=this;if(!this.form){var i,s=document.createElement("form"),a=document.createElement("textarea"),c=this.iframeId="eio_iframe_"+this.index;s.className="socketio",s.style.position="absolute",s.style.top="-1000px",s.style.left="-1000px",s.target=c,s.method="POST",s.setAttribute("accept-charset","utf-8"),a.name="d",s.appendChild(a),document.body.appendChild(s),this.form=s,this.area=a;}this.form.action=this.uri(),r(),t=t.replace(p,"\\\n"),this.area.value=t.replace(u,"\\n");try{this.form.submit();}catch(h){}this.iframe.attachEvent?this.iframe.onreadystatechange=function(){"complete"===o.iframe.readyState&&n();}:this.iframe.onload=n;};}).call(e,function(){return this}());},function(t,e,n){function r(t){var e=t&&t.forceBase64;e&&(this.supportsBinary=!1),this.perMessageDeflate=t.perMessageDeflate,this.usingBrowserWebSocket=o&&!t.forceNode,this.protocols=t.protocols,this.usingBrowserWebSocket||(l=i),s.call(this,t);}var o,i,s=n(23),a=n(24),c=n(32),u=n(33),p=n(34),h=n(3)("engine.io-client:websocket");if("undefined"!=typeof WebSocket?o=WebSocket:"undefined"!=typeof self&&(o=self.WebSocket||self.MozWebSocket),"undefined"==typeof window)try{i=n(37);}catch(f){}var l=o||i;t.exports=r,u(r,s),r.prototype.name="websocket",r.prototype.supportsBinary=!0,r.prototype.doOpen=function(){if(this.check()){var t=this.uri(),e=this.protocols,n={agent:this.agent,perMessageDeflate:this.perMessageDeflate};n.pfx=this.pfx,n.key=this.key,n.passphrase=this.passphrase,n.cert=this.cert,n.ca=this.ca,n.ciphers=this.ciphers,n.rejectUnauthorized=this.rejectUnauthorized,this.extraHeaders&&(n.headers=this.extraHeaders),this.localAddress&&(n.localAddress=this.localAddress);try{this.ws=this.usingBrowserWebSocket&&!this.isReactNative?e?new l(t,e):new l(t):new l(t,e,n);}catch(r){return this.emit("error",r)}void 0===this.ws.binaryType&&(this.supportsBinary=!1),this.ws.supports&&this.ws.supports.binary?(this.supportsBinary=!0,this.ws.binaryType="nodebuffer"):this.ws.binaryType="arraybuffer",this.addEventListeners();}},r.prototype.addEventListeners=function(){var t=this;this.ws.onopen=function(){t.onOpen();},this.ws.onclose=function(){t.onClose();},this.ws.onmessage=function(e){t.onData(e.data);},this.ws.onerror=function(e){t.onError("websocket error",e);};},r.prototype.write=function(t){function e(){n.emit("flush"),setTimeout(function(){n.writable=!0,n.emit("drain");},0);}var n=this;this.writable=!1;for(var r=t.length,o=0,i=r;o<i;o++)!function(t){a.encodePacket(t,n.supportsBinary,function(o){if(!n.usingBrowserWebSocket){var i={};if(t.options&&(i.compress=t.options.compress),n.perMessageDeflate){var s="string"==typeof o?Buffer.byteLength(o):o.length;s<n.perMessageDeflate.threshold&&(i.compress=!1);}}try{n.usingBrowserWebSocket?n.ws.send(o):n.ws.send(o,i);}catch(a){h("websocket closed before onclose event");}--r||e();});}(t[o]);},r.prototype.onClose=function(){s.prototype.onClose.call(this);},r.prototype.doClose=function(){"undefined"!=typeof this.ws&&this.ws.close();},r.prototype.uri=function(){var t=this.query||{},e=this.secure?"wss":"ws",n="";this.port&&("wss"===e&&443!==Number(this.port)||"ws"===e&&80!==Number(this.port))&&(n=":"+this.port),this.timestampRequests&&(t[this.timestampParam]=p()),this.supportsBinary||(t.b64=1),t=c.encode(t),t.length&&(t="?"+t);var r=this.hostname.indexOf(":")!==-1;return e+"://"+(r?"["+this.hostname+"]":this.hostname)+n+this.path+t},r.prototype.check=function(){return !(!l||"__initialize"in l&&this.name===r.prototype.name)};},function(t,e){},function(t,e){var n=[].indexOf;t.exports=function(t,e){if(n)return t.indexOf(e);for(var r=0;r<t.length;++r)if(t[r]===e)return r;return -1};},function(t,e,n){function r(t,e,n){this.io=t,this.nsp=e,this.json=this,this.ids=0,this.acks={},this.receiveBuffer=[],this.sendBuffer=[],this.connected=!1,this.disconnected=!0,this.flags={},n&&n.query&&(this.query=n.query),this.io.autoConnect&&this.open();}var o=n(7),i=n(11),s=n(40),a=n(41),c=n(42),u=n(3)("socket.io-client:socket"),p=n(32),h=n(26);t.exports=e=r;var f={connect:1,connect_error:1,connect_timeout:1,connecting:1,disconnect:1,error:1,reconnect:1,reconnect_attempt:1,reconnect_failed:1,reconnect_error:1,reconnecting:1,ping:1,pong:1},l=i.prototype.emit;i(r.prototype),r.prototype.subEvents=function(){if(!this.subs){var t=this.io;this.subs=[a(t,"open",c(this,"onopen")),a(t,"packet",c(this,"onpacket")),a(t,"close",c(this,"onclose"))];}},r.prototype.open=r.prototype.connect=function(){return this.connected?this:(this.subEvents(),this.io.open(),"open"===this.io.readyState&&this.onopen(),this.emit("connecting"),this)},r.prototype.send=function(){var t=s(arguments);return t.unshift("message"),this.emit.apply(this,t),this},r.prototype.emit=function(t){if(f.hasOwnProperty(t))return l.apply(this,arguments),this;var e=s(arguments),n={type:(void 0!==this.flags.binary?this.flags.binary:h(e))?o.BINARY_EVENT:o.EVENT,data:e};return n.options={},n.options.compress=!this.flags||!1!==this.flags.compress,"function"==typeof e[e.length-1]&&(u("emitting packet with ack id %d",this.ids),this.acks[this.ids]=e.pop(),n.id=this.ids++),this.connected?this.packet(n):this.sendBuffer.push(n),this.flags={},this},r.prototype.packet=function(t){t.nsp=this.nsp,this.io.packet(t);},r.prototype.onopen=function(){if(u("transport is open - connecting"),"/"!==this.nsp)if(this.query){var t="object"==typeof this.query?p.encode(this.query):this.query;u("sending connect packet with query %s",t),this.packet({type:o.CONNECT,query:t});}else this.packet({type:o.CONNECT});},r.prototype.onclose=function(t){u("close (%s)",t),this.connected=!1,this.disconnected=!0,delete this.id,this.emit("disconnect",t);},r.prototype.onpacket=function(t){var e=t.nsp===this.nsp,n=t.type===o.ERROR&&"/"===t.nsp;if(e||n)switch(t.type){case o.CONNECT:this.onconnect();break;case o.EVENT:this.onevent(t);break;case o.BINARY_EVENT:this.onevent(t);break;case o.ACK:this.onack(t);break;case o.BINARY_ACK:this.onack(t);break;case o.DISCONNECT:this.ondisconnect();break;case o.ERROR:this.emit("error",t.data);}},r.prototype.onevent=function(t){var e=t.data||[];u("emitting event %j",e),null!=t.id&&(u("attaching ack callback to event"),e.push(this.ack(t.id))),this.connected?l.apply(this,e):this.receiveBuffer.push(e);},r.prototype.ack=function(t){var e=this,n=!1;return function(){if(!n){n=!0;var r=s(arguments);u("sending ack %j",r),e.packet({type:h(r)?o.BINARY_ACK:o.ACK,id:t,data:r});}}},r.prototype.onack=function(t){var e=this.acks[t.id];"function"==typeof e?(u("calling ack %s with %j",t.id,t.data),e.apply(this,t.data),delete this.acks[t.id]):u("bad ack %s",t.id);},r.prototype.onconnect=function(){this.connected=!0,this.disconnected=!1,this.emit("connect"),this.emitBuffered();},r.prototype.emitBuffered=function(){var t;for(t=0;t<this.receiveBuffer.length;t++)l.apply(this,this.receiveBuffer[t]);for(this.receiveBuffer=[],t=0;t<this.sendBuffer.length;t++)this.packet(this.sendBuffer[t]);this.sendBuffer=[];},r.prototype.ondisconnect=function(){u("server disconnect (%s)",this.nsp),this.destroy(),this.onclose("io server disconnect");},r.prototype.destroy=function(){if(this.subs){for(var t=0;t<this.subs.length;t++)this.subs[t].destroy();this.subs=null;}this.io.destroy(this);},r.prototype.close=r.prototype.disconnect=function(){return this.connected&&(u("performing disconnect (%s)",this.nsp),this.packet({type:o.DISCONNECT})),this.destroy(),this.connected&&this.onclose("io client disconnect"),this},r.prototype.compress=function(t){return this.flags.compress=t,this},r.prototype.binary=function(t){return this.flags.binary=t,this};},function(t,e){function n(t,e){var n=[];e=e||0;for(var r=e||0;r<t.length;r++)n[r-e]=t[r];return n}t.exports=n;},function(t,e){function n(t,e,n){return t.on(e,n),{destroy:function(){t.removeListener(e,n);}}}t.exports=n;},function(t,e){var n=[].slice;t.exports=function(t,e){if("string"==typeof e&&(e=t[e]),"function"!=typeof e)throw new Error("bind() requires a function");var r=n.call(arguments,2);return function(){return e.apply(t,r.concat(n.call(arguments)))}};},function(t,e){function n(t){t=t||{},this.ms=t.min||100,this.max=t.max||1e4,this.factor=t.factor||2,this.jitter=t.jitter>0&&t.jitter<=1?t.jitter:0,this.attempts=0;}t.exports=n,n.prototype.duration=function(){var t=this.ms*Math.pow(this.factor,this.attempts++);if(this.jitter){var e=Math.random(),n=Math.floor(e*this.jitter*t);t=0==(1&Math.floor(10*e))?t-n:t+n;}return 0|Math.min(t,this.max)},n.prototype.reset=function(){this.attempts=0;},n.prototype.setMin=function(t){this.ms=t;},n.prototype.setMax=function(t){this.max=t;},n.prototype.setJitter=function(t){this.jitter=t;};}])});

    });
    var socket_io_1 = socket_io.io;

    var aspromise = asPromise;

    /**
     * Callback as used by {@link util.asPromise}.
     * @typedef asPromiseCallback
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {...*} params Additional arguments
     * @returns {undefined}
     */

    /**
     * Returns a promise from a node-style callback function.
     * @memberof util
     * @param {asPromiseCallback} fn Function to call
     * @param {*} ctx Function context
     * @param {...*} params Function arguments
     * @returns {Promise<*>} Promisified function
     */
    function asPromise(fn, ctx/*, varargs */) {
        var params  = new Array(arguments.length - 1),
            offset  = 0,
            index   = 2,
            pending = true;
        while (index < arguments.length)
            params[offset++] = arguments[index++];
        return new Promise(function executor(resolve, reject) {
            params[offset] = function callback(err/*, varargs */) {
                if (pending) {
                    pending = false;
                    if (err)
                        reject(err);
                    else {
                        var params = new Array(arguments.length - 1),
                            offset = 0;
                        while (offset < params.length)
                            params[offset++] = arguments[offset];
                        resolve.apply(null, params);
                    }
                }
            };
            try {
                fn.apply(ctx || null, params);
            } catch (err) {
                if (pending) {
                    pending = false;
                    reject(err);
                }
            }
        });
    }

    var base64_1 = createCommonjsModule(function (module, exports) {

    /**
     * A minimal base64 implementation for number arrays.
     * @memberof util
     * @namespace
     */
    var base64 = exports;

    /**
     * Calculates the byte length of a base64 encoded string.
     * @param {string} string Base64 encoded string
     * @returns {number} Byte length
     */
    base64.length = function length(string) {
        var p = string.length;
        if (!p)
            return 0;
        var n = 0;
        while (--p % 4 > 1 && string.charAt(p) === "=")
            ++n;
        return Math.ceil(string.length * 3) / 4 - n;
    };

    // Base64 encoding table
    var b64 = new Array(64);

    // Base64 decoding table
    var s64 = new Array(123);

    // 65..90, 97..122, 48..57, 43, 47
    for (var i = 0; i < 64;)
        s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

    /**
     * Encodes a buffer to a base64 encoded string.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} Base64 encoded string
     */
    base64.encode = function encode(buffer, start, end) {
        var parts = null,
            chunk = [];
        var i = 0, // output index
            j = 0, // goto index
            t;     // temporary
        while (start < end) {
            var b = buffer[start++];
            switch (j) {
                case 0:
                    chunk[i++] = b64[b >> 2];
                    t = (b & 3) << 4;
                    j = 1;
                    break;
                case 1:
                    chunk[i++] = b64[t | b >> 4];
                    t = (b & 15) << 2;
                    j = 2;
                    break;
                case 2:
                    chunk[i++] = b64[t | b >> 6];
                    chunk[i++] = b64[b & 63];
                    j = 0;
                    break;
            }
            if (i > 8191) {
                (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
                i = 0;
            }
        }
        if (j) {
            chunk[i++] = b64[t];
            chunk[i++] = 61;
            if (j === 1)
                chunk[i++] = 61;
        }
        if (parts) {
            if (i)
                parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
            return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i));
    };

    var invalidEncoding = "invalid encoding";

    /**
     * Decodes a base64 encoded string to a buffer.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Number of bytes written
     * @throws {Error} If encoding is invalid
     */
    base64.decode = function decode(string, buffer, offset) {
        var start = offset;
        var j = 0, // goto index
            t;     // temporary
        for (var i = 0; i < string.length;) {
            var c = string.charCodeAt(i++);
            if (c === 61 && j > 1)
                break;
            if ((c = s64[c]) === undefined)
                throw Error(invalidEncoding);
            switch (j) {
                case 0:
                    t = c;
                    j = 1;
                    break;
                case 1:
                    buffer[offset++] = t << 2 | (c & 48) >> 4;
                    t = c;
                    j = 2;
                    break;
                case 2:
                    buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                    t = c;
                    j = 3;
                    break;
                case 3:
                    buffer[offset++] = (t & 3) << 6 | c;
                    j = 0;
                    break;
            }
        }
        if (j === 1)
            throw Error(invalidEncoding);
        return offset - start;
    };

    /**
     * Tests if the specified string appears to be base64 encoded.
     * @param {string} string String to test
     * @returns {boolean} `true` if probably base64 encoded, otherwise false
     */
    base64.test = function test(string) {
        return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
    };
    });

    var eventemitter = EventEmitter;

    /**
     * Constructs a new event emitter instance.
     * @classdesc A minimal event emitter.
     * @memberof util
     * @constructor
     */
    function EventEmitter() {

        /**
         * Registered listeners.
         * @type {Object.<string,*>}
         * @private
         */
        this._listeners = {};
    }

    /**
     * Registers an event listener.
     * @param {string} evt Event name
     * @param {function} fn Listener
     * @param {*} [ctx] Listener context
     * @returns {util.EventEmitter} `this`
     */
    EventEmitter.prototype.on = function on(evt, fn, ctx) {
        (this._listeners[evt] || (this._listeners[evt] = [])).push({
            fn  : fn,
            ctx : ctx || this
        });
        return this;
    };

    /**
     * Removes an event listener or any matching listeners if arguments are omitted.
     * @param {string} [evt] Event name. Removes all listeners if omitted.
     * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
     * @returns {util.EventEmitter} `this`
     */
    EventEmitter.prototype.off = function off(evt, fn) {
        if (evt === undefined)
            this._listeners = {};
        else {
            if (fn === undefined)
                this._listeners[evt] = [];
            else {
                var listeners = this._listeners[evt];
                for (var i = 0; i < listeners.length;)
                    if (listeners[i].fn === fn)
                        listeners.splice(i, 1);
                    else
                        ++i;
            }
        }
        return this;
    };

    /**
     * Emits an event by calling its listeners with the specified arguments.
     * @param {string} evt Event name
     * @param {...*} args Arguments
     * @returns {util.EventEmitter} `this`
     */
    EventEmitter.prototype.emit = function emit(evt) {
        var listeners = this._listeners[evt];
        if (listeners) {
            var args = [],
                i = 1;
            for (; i < arguments.length;)
                args.push(arguments[i++]);
            for (i = 0; i < listeners.length;)
                listeners[i].fn.apply(listeners[i++].ctx, args);
        }
        return this;
    };

    var float_1 = factory(factory);

    /**
     * Reads / writes floats / doubles from / to buffers.
     * @name util.float
     * @namespace
     */

    /**
     * Writes a 32 bit float to a buffer using little endian byte order.
     * @name util.float.writeFloatLE
     * @function
     * @param {number} val Value to write
     * @param {Uint8Array} buf Target buffer
     * @param {number} pos Target buffer offset
     * @returns {undefined}
     */

    /**
     * Writes a 32 bit float to a buffer using big endian byte order.
     * @name util.float.writeFloatBE
     * @function
     * @param {number} val Value to write
     * @param {Uint8Array} buf Target buffer
     * @param {number} pos Target buffer offset
     * @returns {undefined}
     */

    /**
     * Reads a 32 bit float from a buffer using little endian byte order.
     * @name util.float.readFloatLE
     * @function
     * @param {Uint8Array} buf Source buffer
     * @param {number} pos Source buffer offset
     * @returns {number} Value read
     */

    /**
     * Reads a 32 bit float from a buffer using big endian byte order.
     * @name util.float.readFloatBE
     * @function
     * @param {Uint8Array} buf Source buffer
     * @param {number} pos Source buffer offset
     * @returns {number} Value read
     */

    /**
     * Writes a 64 bit double to a buffer using little endian byte order.
     * @name util.float.writeDoubleLE
     * @function
     * @param {number} val Value to write
     * @param {Uint8Array} buf Target buffer
     * @param {number} pos Target buffer offset
     * @returns {undefined}
     */

    /**
     * Writes a 64 bit double to a buffer using big endian byte order.
     * @name util.float.writeDoubleBE
     * @function
     * @param {number} val Value to write
     * @param {Uint8Array} buf Target buffer
     * @param {number} pos Target buffer offset
     * @returns {undefined}
     */

    /**
     * Reads a 64 bit double from a buffer using little endian byte order.
     * @name util.float.readDoubleLE
     * @function
     * @param {Uint8Array} buf Source buffer
     * @param {number} pos Source buffer offset
     * @returns {number} Value read
     */

    /**
     * Reads a 64 bit double from a buffer using big endian byte order.
     * @name util.float.readDoubleBE
     * @function
     * @param {Uint8Array} buf Source buffer
     * @param {number} pos Source buffer offset
     * @returns {number} Value read
     */

    // Factory function for the purpose of node-based testing in modified global environments
    function factory(exports) {

        // float: typed array
        if (typeof Float32Array !== "undefined") (function() {

            var f32 = new Float32Array([ -0 ]),
                f8b = new Uint8Array(f32.buffer),
                le  = f8b[3] === 128;

            function writeFloat_f32_cpy(val, buf, pos) {
                f32[0] = val;
                buf[pos    ] = f8b[0];
                buf[pos + 1] = f8b[1];
                buf[pos + 2] = f8b[2];
                buf[pos + 3] = f8b[3];
            }

            function writeFloat_f32_rev(val, buf, pos) {
                f32[0] = val;
                buf[pos    ] = f8b[3];
                buf[pos + 1] = f8b[2];
                buf[pos + 2] = f8b[1];
                buf[pos + 3] = f8b[0];
            }

            /* istanbul ignore next */
            exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
            /* istanbul ignore next */
            exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

            function readFloat_f32_cpy(buf, pos) {
                f8b[0] = buf[pos    ];
                f8b[1] = buf[pos + 1];
                f8b[2] = buf[pos + 2];
                f8b[3] = buf[pos + 3];
                return f32[0];
            }

            function readFloat_f32_rev(buf, pos) {
                f8b[3] = buf[pos    ];
                f8b[2] = buf[pos + 1];
                f8b[1] = buf[pos + 2];
                f8b[0] = buf[pos + 3];
                return f32[0];
            }

            /* istanbul ignore next */
            exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
            /* istanbul ignore next */
            exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

        // float: ieee754
        })(); else (function() {

            function writeFloat_ieee754(writeUint, val, buf, pos) {
                var sign = val < 0 ? 1 : 0;
                if (sign)
                    val = -val;
                if (val === 0)
                    writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos);
                else if (isNaN(val))
                    writeUint(2143289344, buf, pos);
                else if (val > 3.4028234663852886e+38) // +-Infinity
                    writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
                else if (val < 1.1754943508222875e-38) // denormal
                    writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
                else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2),
                        mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                    writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
                }
            }

            exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
            exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

            function readFloat_ieee754(readUint, buf, pos) {
                var uint = readUint(buf, pos),
                    sign = (uint >> 31) * 2 + 1,
                    exponent = uint >>> 23 & 255,
                    mantissa = uint & 8388607;
                return exponent === 255
                    ? mantissa
                    ? NaN
                    : sign * Infinity
                    : exponent === 0 // denormal
                    ? sign * 1.401298464324817e-45 * mantissa
                    : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
            }

            exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
            exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);

        })();

        // double: typed array
        if (typeof Float64Array !== "undefined") (function() {

            var f64 = new Float64Array([-0]),
                f8b = new Uint8Array(f64.buffer),
                le  = f8b[7] === 128;

            function writeDouble_f64_cpy(val, buf, pos) {
                f64[0] = val;
                buf[pos    ] = f8b[0];
                buf[pos + 1] = f8b[1];
                buf[pos + 2] = f8b[2];
                buf[pos + 3] = f8b[3];
                buf[pos + 4] = f8b[4];
                buf[pos + 5] = f8b[5];
                buf[pos + 6] = f8b[6];
                buf[pos + 7] = f8b[7];
            }

            function writeDouble_f64_rev(val, buf, pos) {
                f64[0] = val;
                buf[pos    ] = f8b[7];
                buf[pos + 1] = f8b[6];
                buf[pos + 2] = f8b[5];
                buf[pos + 3] = f8b[4];
                buf[pos + 4] = f8b[3];
                buf[pos + 5] = f8b[2];
                buf[pos + 6] = f8b[1];
                buf[pos + 7] = f8b[0];
            }

            /* istanbul ignore next */
            exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
            /* istanbul ignore next */
            exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

            function readDouble_f64_cpy(buf, pos) {
                f8b[0] = buf[pos    ];
                f8b[1] = buf[pos + 1];
                f8b[2] = buf[pos + 2];
                f8b[3] = buf[pos + 3];
                f8b[4] = buf[pos + 4];
                f8b[5] = buf[pos + 5];
                f8b[6] = buf[pos + 6];
                f8b[7] = buf[pos + 7];
                return f64[0];
            }

            function readDouble_f64_rev(buf, pos) {
                f8b[7] = buf[pos    ];
                f8b[6] = buf[pos + 1];
                f8b[5] = buf[pos + 2];
                f8b[4] = buf[pos + 3];
                f8b[3] = buf[pos + 4];
                f8b[2] = buf[pos + 5];
                f8b[1] = buf[pos + 6];
                f8b[0] = buf[pos + 7];
                return f64[0];
            }

            /* istanbul ignore next */
            exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
            /* istanbul ignore next */
            exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

        // double: ieee754
        })(); else (function() {

            function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
                var sign = val < 0 ? 1 : 0;
                if (sign)
                    val = -val;
                if (val === 0) {
                    writeUint(0, buf, pos + off0);
                    writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos + off1);
                } else if (isNaN(val)) {
                    writeUint(0, buf, pos + off0);
                    writeUint(2146959360, buf, pos + off1);
                } else if (val > 1.7976931348623157e+308) { // +-Infinity
                    writeUint(0, buf, pos + off0);
                    writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
                } else {
                    var mantissa;
                    if (val < 2.2250738585072014e-308) { // denormal
                        mantissa = val / 5e-324;
                        writeUint(mantissa >>> 0, buf, pos + off0);
                        writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                    } else {
                        var exponent = Math.floor(Math.log(val) / Math.LN2);
                        if (exponent === 1024)
                            exponent = 1023;
                        mantissa = val * Math.pow(2, -exponent);
                        writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                        writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                    }
                }
            }

            exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
            exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

            function readDouble_ieee754(readUint, off0, off1, buf, pos) {
                var lo = readUint(buf, pos + off0),
                    hi = readUint(buf, pos + off1);
                var sign = (hi >> 31) * 2 + 1,
                    exponent = hi >>> 20 & 2047,
                    mantissa = 4294967296 * (hi & 1048575) + lo;
                return exponent === 2047
                    ? mantissa
                    ? NaN
                    : sign * Infinity
                    : exponent === 0 // denormal
                    ? sign * 5e-324 * mantissa
                    : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
            }

            exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
            exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);

        })();

        return exports;
    }

    // uint helpers

    function writeUintLE(val, buf, pos) {
        buf[pos    ] =  val        & 255;
        buf[pos + 1] =  val >>> 8  & 255;
        buf[pos + 2] =  val >>> 16 & 255;
        buf[pos + 3] =  val >>> 24;
    }

    function writeUintBE(val, buf, pos) {
        buf[pos    ] =  val >>> 24;
        buf[pos + 1] =  val >>> 16 & 255;
        buf[pos + 2] =  val >>> 8  & 255;
        buf[pos + 3] =  val        & 255;
    }

    function readUintLE(buf, pos) {
        return (buf[pos    ]
              | buf[pos + 1] << 8
              | buf[pos + 2] << 16
              | buf[pos + 3] << 24) >>> 0;
    }

    function readUintBE(buf, pos) {
        return (buf[pos    ] << 24
              | buf[pos + 1] << 16
              | buf[pos + 2] << 8
              | buf[pos + 3]) >>> 0;
    }

    var inquire_1 = inquire;

    /**
     * Requires a module only if available.
     * @memberof util
     * @param {string} moduleName Module to require
     * @returns {?Object} Required module if available and not empty, otherwise `null`
     */
    function inquire(moduleName) {
        try {
            var mod = commonjsRequire(moduleName); // eslint-disable-line no-eval
            if (mod && (mod.length || Object.keys(mod).length))
                return mod;
        } catch (e) {} // eslint-disable-line no-empty
        return null;
    }

    var utf8_1 = createCommonjsModule(function (module, exports) {

    /**
     * A minimal UTF8 implementation for number arrays.
     * @memberof util
     * @namespace
     */
    var utf8 = exports;

    /**
     * Calculates the UTF8 byte length of a string.
     * @param {string} string String
     * @returns {number} Byte length
     */
    utf8.length = function utf8_length(string) {
        var len = 0,
            c = 0;
        for (var i = 0; i < string.length; ++i) {
            c = string.charCodeAt(i);
            if (c < 128)
                len += 1;
            else if (c < 2048)
                len += 2;
            else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
                ++i;
                len += 4;
            } else
                len += 3;
        }
        return len;
    };

    /**
     * Reads UTF8 bytes as a string.
     * @param {Uint8Array} buffer Source buffer
     * @param {number} start Source start
     * @param {number} end Source end
     * @returns {string} String read
     */
    utf8.read = function utf8_read(buffer, start, end) {
        var len = end - start;
        if (len < 1)
            return "";
        var parts = null,
            chunk = [],
            i = 0, // char offset
            t;     // temporary
        while (start < end) {
            t = buffer[start++];
            if (t < 128)
                chunk[i++] = t;
            else if (t > 191 && t < 224)
                chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
            else if (t > 239 && t < 365) {
                t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
                chunk[i++] = 0xD800 + (t >> 10);
                chunk[i++] = 0xDC00 + (t & 1023);
            } else
                chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
            if (i > 8191) {
                (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
                i = 0;
            }
        }
        if (parts) {
            if (i)
                parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
            return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i));
    };

    /**
     * Writes a string as UTF8 bytes.
     * @param {string} string Source string
     * @param {Uint8Array} buffer Destination buffer
     * @param {number} offset Destination offset
     * @returns {number} Bytes written
     */
    utf8.write = function utf8_write(string, buffer, offset) {
        var start = offset,
            c1, // character 1
            c2; // character 2
        for (var i = 0; i < string.length; ++i) {
            c1 = string.charCodeAt(i);
            if (c1 < 128) {
                buffer[offset++] = c1;
            } else if (c1 < 2048) {
                buffer[offset++] = c1 >> 6       | 192;
                buffer[offset++] = c1       & 63 | 128;
            } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
                c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
                ++i;
                buffer[offset++] = c1 >> 18      | 240;
                buffer[offset++] = c1 >> 12 & 63 | 128;
                buffer[offset++] = c1 >> 6  & 63 | 128;
                buffer[offset++] = c1       & 63 | 128;
            } else {
                buffer[offset++] = c1 >> 12      | 224;
                buffer[offset++] = c1 >> 6  & 63 | 128;
                buffer[offset++] = c1       & 63 | 128;
            }
        }
        return offset - start;
    };
    });

    var pool_1 = pool;

    /**
     * An allocator as used by {@link util.pool}.
     * @typedef PoolAllocator
     * @type {function}
     * @param {number} size Buffer size
     * @returns {Uint8Array} Buffer
     */

    /**
     * A slicer as used by {@link util.pool}.
     * @typedef PoolSlicer
     * @type {function}
     * @param {number} start Start offset
     * @param {number} end End offset
     * @returns {Uint8Array} Buffer slice
     * @this {Uint8Array}
     */

    /**
     * A general purpose buffer pool.
     * @memberof util
     * @function
     * @param {PoolAllocator} alloc Allocator
     * @param {PoolSlicer} slice Slicer
     * @param {number} [size=8192] Slab size
     * @returns {PoolAllocator} Pooled allocator
     */
    function pool(alloc, slice, size) {
        var SIZE   = size || 8192;
        var MAX    = SIZE >>> 1;
        var slab   = null;
        var offset = SIZE;
        return function pool_alloc(size) {
            if (size < 1 || size > MAX)
                return alloc(size);
            if (offset + size > SIZE) {
                slab = alloc(SIZE);
                offset = 0;
            }
            var buf = slice.call(slab, offset, offset += size);
            if (offset & 7) // align to 32 bit
                offset = (offset | 7) + 1;
            return buf;
        };
    }

    var longbits = LongBits;



    /**
     * Constructs new long bits.
     * @classdesc Helper class for working with the low and high bits of a 64 bit value.
     * @memberof util
     * @constructor
     * @param {number} lo Low 32 bits, unsigned
     * @param {number} hi High 32 bits, unsigned
     */
    function LongBits(lo, hi) {

        // note that the casts below are theoretically unnecessary as of today, but older statically
        // generated converter code might still call the ctor with signed 32bits. kept for compat.

        /**
         * Low bits.
         * @type {number}
         */
        this.lo = lo >>> 0;

        /**
         * High bits.
         * @type {number}
         */
        this.hi = hi >>> 0;
    }

    /**
     * Zero bits.
     * @memberof util.LongBits
     * @type {util.LongBits}
     */
    var zero = LongBits.zero = new LongBits(0, 0);

    zero.toNumber = function() { return 0; };
    zero.zzEncode = zero.zzDecode = function() { return this; };
    zero.length = function() { return 1; };

    /**
     * Zero hash.
     * @memberof util.LongBits
     * @type {string}
     */
    var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";

    /**
     * Constructs new long bits from the specified number.
     * @param {number} value Value
     * @returns {util.LongBits} Instance
     */
    LongBits.fromNumber = function fromNumber(value) {
        if (value === 0)
            return zero;
        var sign = value < 0;
        if (sign)
            value = -value;
        var lo = value >>> 0,
            hi = (value - lo) / 4294967296 >>> 0;
        if (sign) {
            hi = ~hi >>> 0;
            lo = ~lo >>> 0;
            if (++lo > 4294967295) {
                lo = 0;
                if (++hi > 4294967295)
                    hi = 0;
            }
        }
        return new LongBits(lo, hi);
    };

    /**
     * Constructs new long bits from a number, long or string.
     * @param {Long|number|string} value Value
     * @returns {util.LongBits} Instance
     */
    LongBits.from = function from(value) {
        if (typeof value === "number")
            return LongBits.fromNumber(value);
        if (minimal.isString(value)) {
            /* istanbul ignore else */
            if (minimal.Long)
                value = minimal.Long.fromString(value);
            else
                return LongBits.fromNumber(parseInt(value, 10));
        }
        return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
    };

    /**
     * Converts this long bits to a possibly unsafe JavaScript number.
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {number} Possibly unsafe number
     */
    LongBits.prototype.toNumber = function toNumber(unsigned) {
        if (!unsigned && this.hi >>> 31) {
            var lo = ~this.lo + 1 >>> 0,
                hi = ~this.hi     >>> 0;
            if (!lo)
                hi = hi + 1 >>> 0;
            return -(lo + hi * 4294967296);
        }
        return this.lo + this.hi * 4294967296;
    };

    /**
     * Converts this long bits to a long.
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {Long} Long
     */
    LongBits.prototype.toLong = function toLong(unsigned) {
        return minimal.Long
            ? new minimal.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
            /* istanbul ignore next */
            : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
    };

    var charCodeAt = String.prototype.charCodeAt;

    /**
     * Constructs new long bits from the specified 8 characters long hash.
     * @param {string} hash Hash
     * @returns {util.LongBits} Bits
     */
    LongBits.fromHash = function fromHash(hash) {
        if (hash === zeroHash)
            return zero;
        return new LongBits(
            ( charCodeAt.call(hash, 0)
            | charCodeAt.call(hash, 1) << 8
            | charCodeAt.call(hash, 2) << 16
            | charCodeAt.call(hash, 3) << 24) >>> 0
        ,
            ( charCodeAt.call(hash, 4)
            | charCodeAt.call(hash, 5) << 8
            | charCodeAt.call(hash, 6) << 16
            | charCodeAt.call(hash, 7) << 24) >>> 0
        );
    };

    /**
     * Converts this long bits to a 8 characters long hash.
     * @returns {string} Hash
     */
    LongBits.prototype.toHash = function toHash() {
        return String.fromCharCode(
            this.lo        & 255,
            this.lo >>> 8  & 255,
            this.lo >>> 16 & 255,
            this.lo >>> 24      ,
            this.hi        & 255,
            this.hi >>> 8  & 255,
            this.hi >>> 16 & 255,
            this.hi >>> 24
        );
    };

    /**
     * Zig-zag encodes this long bits.
     * @returns {util.LongBits} `this`
     */
    LongBits.prototype.zzEncode = function zzEncode() {
        var mask =   this.hi >> 31;
        this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
        this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
        return this;
    };

    /**
     * Zig-zag decodes this long bits.
     * @returns {util.LongBits} `this`
     */
    LongBits.prototype.zzDecode = function zzDecode() {
        var mask = -(this.lo & 1);
        this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
        this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
        return this;
    };

    /**
     * Calculates the length of this longbits when encoded as a varint.
     * @returns {number} Length
     */
    LongBits.prototype.length = function length() {
        var part0 =  this.lo,
            part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
            part2 =  this.hi >>> 24;
        return part2 === 0
             ? part1 === 0
               ? part0 < 16384
                 ? part0 < 128 ? 1 : 2
                 : part0 < 2097152 ? 3 : 4
               : part1 < 16384
                 ? part1 < 128 ? 5 : 6
                 : part1 < 2097152 ? 7 : 8
             : part2 < 128 ? 9 : 10;
    };

    var minimal = createCommonjsModule(function (module, exports) {
    var util = exports;

    // used to return a Promise where callback is omitted
    util.asPromise = aspromise;

    // converts to / from base64 encoded strings
    util.base64 = base64_1;

    // base class of rpc.Service
    util.EventEmitter = eventemitter;

    // float handling accross browsers
    util.float = float_1;

    // requires modules optionally and hides the call from bundlers
    util.inquire = inquire_1;

    // converts to / from utf8 encoded strings
    util.utf8 = utf8_1;

    // provides a node-like buffer pool in the browser
    util.pool = pool_1;

    // utility to work with the low and high bits of a 64 bit value
    util.LongBits = longbits;

    // global object reference
    util.global = typeof window !== "undefined" && window
               || typeof commonjsGlobal !== "undefined" && commonjsGlobal
               || typeof self   !== "undefined" && self
               || commonjsGlobal; // eslint-disable-line no-invalid-this

    /**
     * An immuable empty array.
     * @memberof util
     * @type {Array.<*>}
     * @const
     */
    util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */ []; // used on prototypes

    /**
     * An immutable empty object.
     * @type {Object}
     * @const
     */
    util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */ {}; // used on prototypes

    /**
     * Whether running within node or not.
     * @memberof util
     * @type {boolean}
     * @const
     */
    util.isNode = Boolean(util.global.process && util.global.process.versions && util.global.process.versions.node);

    /**
     * Tests if the specified value is an integer.
     * @function
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is an integer
     */
    util.isInteger = Number.isInteger || /* istanbul ignore next */ function isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
    };

    /**
     * Tests if the specified value is a string.
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is a string
     */
    util.isString = function isString(value) {
        return typeof value === "string" || value instanceof String;
    };

    /**
     * Tests if the specified value is a non-null object.
     * @param {*} value Value to test
     * @returns {boolean} `true` if the value is a non-null object
     */
    util.isObject = function isObject(value) {
        return value && typeof value === "object";
    };

    /**
     * Checks if a property on a message is considered to be present.
     * This is an alias of {@link util.isSet}.
     * @function
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isset =

    /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    util.isSet = function isSet(obj, prop) {
        var value = obj[prop];
        if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
            return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
        return false;
    };

    /**
     * Any compatible Buffer instance.
     * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
     * @interface Buffer
     * @extends Uint8Array
     */

    /**
     * Node's Buffer class if available.
     * @type {Constructor<Buffer>}
     */
    util.Buffer = (function() {
        try {
            var Buffer = util.inquire("buffer").Buffer;
            // refuse to use non-node buffers if not explicitly assigned (perf reasons):
            return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */ null;
        } catch (e) {
            /* istanbul ignore next */
            return null;
        }
    })();

    // Internal alias of or polyfull for Buffer.from.
    util._Buffer_from = null;

    // Internal alias of or polyfill for Buffer.allocUnsafe.
    util._Buffer_allocUnsafe = null;

    /**
     * Creates a new buffer of whatever type supported by the environment.
     * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
     * @returns {Uint8Array|Buffer} Buffer
     */
    util.newBuffer = function newBuffer(sizeOrArray) {
        /* istanbul ignore next */
        return typeof sizeOrArray === "number"
            ? util.Buffer
                ? util._Buffer_allocUnsafe(sizeOrArray)
                : new util.Array(sizeOrArray)
            : util.Buffer
                ? util._Buffer_from(sizeOrArray)
                : typeof Uint8Array === "undefined"
                    ? sizeOrArray
                    : new Uint8Array(sizeOrArray);
    };

    /**
     * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
     * @type {Constructor<Uint8Array>}
     */
    util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

    /**
     * Any compatible Long instance.
     * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
     * @interface Long
     * @property {number} low Low bits
     * @property {number} high High bits
     * @property {boolean} unsigned Whether unsigned or not
     */

    /**
     * Long.js's Long class if available.
     * @type {Constructor<Long>}
     */
    util.Long = /* istanbul ignore next */ util.global.dcodeIO && /* istanbul ignore next */ util.global.dcodeIO.Long
             || /* istanbul ignore next */ util.global.Long
             || util.inquire("long");

    /**
     * Regular expression used to verify 2 bit (`bool`) map keys.
     * @type {RegExp}
     * @const
     */
    util.key2Re = /^true|false|0|1$/;

    /**
     * Regular expression used to verify 32 bit (`int32` etc.) map keys.
     * @type {RegExp}
     * @const
     */
    util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

    /**
     * Regular expression used to verify 64 bit (`int64` etc.) map keys.
     * @type {RegExp}
     * @const
     */
    util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

    /**
     * Converts a number or long to an 8 characters long hash string.
     * @param {Long|number} value Value to convert
     * @returns {string} Hash
     */
    util.longToHash = function longToHash(value) {
        return value
            ? util.LongBits.from(value).toHash()
            : util.LongBits.zeroHash;
    };

    /**
     * Converts an 8 characters long hash string to a long or number.
     * @param {string} hash Hash
     * @param {boolean} [unsigned=false] Whether unsigned or not
     * @returns {Long|number} Original value
     */
    util.longFromHash = function longFromHash(hash, unsigned) {
        var bits = util.LongBits.fromHash(hash);
        if (util.Long)
            return util.Long.fromBits(bits.lo, bits.hi, unsigned);
        return bits.toNumber(Boolean(unsigned));
    };

    /**
     * Merges the properties of the source object into the destination object.
     * @memberof util
     * @param {Object.<string,*>} dst Destination object
     * @param {Object.<string,*>} src Source object
     * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
     * @returns {Object.<string,*>} Destination object
     */
    function merge(dst, src, ifNotSet) { // used by converters
        for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
            if (dst[keys[i]] === undefined || !ifNotSet)
                dst[keys[i]] = src[keys[i]];
        return dst;
    }

    util.merge = merge;

    /**
     * Converts the first character of a string to lower case.
     * @param {string} str String to convert
     * @returns {string} Converted string
     */
    util.lcFirst = function lcFirst(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
    };

    /**
     * Creates a custom error constructor.
     * @memberof util
     * @param {string} name Error name
     * @returns {Constructor<Error>} Custom error constructor
     */
    function newError(name) {

        function CustomError(message, properties) {

            if (!(this instanceof CustomError))
                return new CustomError(message, properties);

            // Error.call(this, message);
            // ^ just returns a new error instance because the ctor can be called as a function

            Object.defineProperty(this, "message", { get: function() { return message; } });

            /* istanbul ignore next */
            if (Error.captureStackTrace) // node
                Error.captureStackTrace(this, CustomError);
            else
                Object.defineProperty(this, "stack", { value: (new Error()).stack || "" });

            if (properties)
                merge(this, properties);
        }

        (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

        Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });

        CustomError.prototype.toString = function toString() {
            return this.name + ": " + this.message;
        };

        return CustomError;
    }

    util.newError = newError;

    /**
     * Constructs a new protocol error.
     * @classdesc Error subclass indicating a protocol specifc error.
     * @memberof util
     * @extends Error
     * @template T extends Message<T>
     * @constructor
     * @param {string} message Error message
     * @param {Object.<string,*>} [properties] Additional properties
     * @example
     * try {
     *     MyMessage.decode(someBuffer); // throws if required fields are missing
     * } catch (e) {
     *     if (e instanceof ProtocolError && e.instance)
     *         console.log("decoded so far: " + JSON.stringify(e.instance));
     * }
     */
    util.ProtocolError = newError("ProtocolError");

    /**
     * So far decoded message instance.
     * @name util.ProtocolError#instance
     * @type {Message<T>}
     */

    /**
     * A OneOf getter as returned by {@link util.oneOfGetter}.
     * @typedef OneOfGetter
     * @type {function}
     * @returns {string|undefined} Set field name, if any
     */

    /**
     * Builds a getter for a oneof's present field name.
     * @param {string[]} fieldNames Field names
     * @returns {OneOfGetter} Unbound getter
     */
    util.oneOfGetter = function getOneOf(fieldNames) {
        var fieldMap = {};
        for (var i = 0; i < fieldNames.length; ++i)
            fieldMap[fieldNames[i]] = 1;

        /**
         * @returns {string|undefined} Set field name, if any
         * @this Object
         * @ignore
         */
        return function() { // eslint-disable-line consistent-return
            for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
                if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                    return keys[i];
        };
    };

    /**
     * A OneOf setter as returned by {@link util.oneOfSetter}.
     * @typedef OneOfSetter
     * @type {function}
     * @param {string|undefined} value Field name
     * @returns {undefined}
     */

    /**
     * Builds a setter for a oneof's present field name.
     * @param {string[]} fieldNames Field names
     * @returns {OneOfSetter} Unbound setter
     */
    util.oneOfSetter = function setOneOf(fieldNames) {

        /**
         * @param {string} name Field name
         * @returns {undefined}
         * @this Object
         * @ignore
         */
        return function(name) {
            for (var i = 0; i < fieldNames.length; ++i)
                if (fieldNames[i] !== name)
                    delete this[fieldNames[i]];
        };
    };

    /**
     * Default conversion options used for {@link Message#toJSON} implementations.
     *
     * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
     *
     * - Longs become strings
     * - Enums become string keys
     * - Bytes become base64 encoded strings
     * - (Sub-)Messages become plain objects
     * - Maps become plain objects with all string keys
     * - Repeated fields become arrays
     * - NaN and Infinity for float and double fields become strings
     *
     * @type {IConversionOptions}
     * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
     */
    util.toJSONOptions = {
        longs: String,
        enums: String,
        bytes: String,
        json: true
    };

    // Sets up buffer utility according to the environment (called in index-minimal)
    util._configure = function() {
        var Buffer = util.Buffer;
        /* istanbul ignore if */
        if (!Buffer) {
            util._Buffer_from = util._Buffer_allocUnsafe = null;
            return;
        }
        // because node 4.x buffers are incompatible & immutable
        // see: https://github.com/dcodeIO/protobuf.js/pull/665
        util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
            /* istanbul ignore next */
            function Buffer_from(value, encoding) {
                return new Buffer(value, encoding);
            };
        util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
            /* istanbul ignore next */
            function Buffer_allocUnsafe(size) {
                return new Buffer(size);
            };
    };
    });

    var writer = Writer;



    var BufferWriter; // cyclic

    var LongBits$1  = minimal.LongBits,
        base64    = minimal.base64,
        utf8      = minimal.utf8;

    /**
     * Constructs a new writer operation instance.
     * @classdesc Scheduled writer operation.
     * @constructor
     * @param {function(*, Uint8Array, number)} fn Function to call
     * @param {number} len Value byte length
     * @param {*} val Value to write
     * @ignore
     */
    function Op(fn, len, val) {

        /**
         * Function to call.
         * @type {function(Uint8Array, number, *)}
         */
        this.fn = fn;

        /**
         * Value byte length.
         * @type {number}
         */
        this.len = len;

        /**
         * Next operation.
         * @type {Writer.Op|undefined}
         */
        this.next = undefined;

        /**
         * Value to write.
         * @type {*}
         */
        this.val = val; // type varies
    }

    /* istanbul ignore next */
    function noop$1() {} // eslint-disable-line no-empty-function

    /**
     * Constructs a new writer state instance.
     * @classdesc Copied writer state.
     * @memberof Writer
     * @constructor
     * @param {Writer} writer Writer to copy state from
     * @ignore
     */
    function State(writer) {

        /**
         * Current head.
         * @type {Writer.Op}
         */
        this.head = writer.head;

        /**
         * Current tail.
         * @type {Writer.Op}
         */
        this.tail = writer.tail;

        /**
         * Current buffer length.
         * @type {number}
         */
        this.len = writer.len;

        /**
         * Next state.
         * @type {State|null}
         */
        this.next = writer.states;
    }

    /**
     * Constructs a new writer instance.
     * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
     * @constructor
     */
    function Writer() {

        /**
         * Current length.
         * @type {number}
         */
        this.len = 0;

        /**
         * Operations head.
         * @type {Object}
         */
        this.head = new Op(noop$1, 0, 0);

        /**
         * Operations tail
         * @type {Object}
         */
        this.tail = this.head;

        /**
         * Linked forked states.
         * @type {Object|null}
         */
        this.states = null;

        // When a value is written, the writer calculates its byte length and puts it into a linked
        // list of operations to perform when finish() is called. This both allows us to allocate
        // buffers of the exact required size and reduces the amount of work we have to do compared
        // to first calculating over objects and then encoding over objects. In our case, the encoding
        // part is just a linked list walk calling operations with already prepared values.
    }

    /**
     * Creates a new writer.
     * @function
     * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
     */
    Writer.create = minimal.Buffer
        ? function create_buffer_setup() {
            return (Writer.create = function create_buffer() {
                return new BufferWriter();
            })();
        }
        /* istanbul ignore next */
        : function create_array() {
            return new Writer();
        };

    /**
     * Allocates a buffer of the specified size.
     * @param {number} size Buffer size
     * @returns {Uint8Array} Buffer
     */
    Writer.alloc = function alloc(size) {
        return new minimal.Array(size);
    };

    // Use Uint8Array buffer pool in the browser, just like node does with buffers
    /* istanbul ignore else */
    if (minimal.Array !== Array)
        Writer.alloc = minimal.pool(Writer.alloc, minimal.Array.prototype.subarray);

    /**
     * Pushes a new operation to the queue.
     * @param {function(Uint8Array, number, *)} fn Function to call
     * @param {number} len Value byte length
     * @param {number} val Value to write
     * @returns {Writer} `this`
     * @private
     */
    Writer.prototype._push = function push(fn, len, val) {
        this.tail = this.tail.next = new Op(fn, len, val);
        this.len += len;
        return this;
    };

    function writeByte(val, buf, pos) {
        buf[pos] = val & 255;
    }

    function writeVarint32(val, buf, pos) {
        while (val > 127) {
            buf[pos++] = val & 127 | 128;
            val >>>= 7;
        }
        buf[pos] = val;
    }

    /**
     * Constructs a new varint writer operation instance.
     * @classdesc Scheduled varint writer operation.
     * @extends Op
     * @constructor
     * @param {number} len Value byte length
     * @param {number} val Value to write
     * @ignore
     */
    function VarintOp(len, val) {
        this.len = len;
        this.next = undefined;
        this.val = val;
    }

    VarintOp.prototype = Object.create(Op.prototype);
    VarintOp.prototype.fn = writeVarint32;

    /**
     * Writes an unsigned 32 bit value as a varint.
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.uint32 = function write_uint32(value) {
        // here, the call to this.push has been inlined and a varint specific Op subclass is used.
        // uint32 is by far the most frequently used operation and benefits significantly from this.
        this.len += (this.tail = this.tail.next = new VarintOp(
            (value = value >>> 0)
                    < 128       ? 1
            : value < 16384     ? 2
            : value < 2097152   ? 3
            : value < 268435456 ? 4
            :                     5,
        value)).len;
        return this;
    };

    /**
     * Writes a signed 32 bit value as a varint.
     * @function
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.int32 = function write_int32(value) {
        return value < 0
            ? this._push(writeVarint64, 10, LongBits$1.fromNumber(value)) // 10 bytes per spec
            : this.uint32(value);
    };

    /**
     * Writes a 32 bit value as a varint, zig-zag encoded.
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.sint32 = function write_sint32(value) {
        return this.uint32((value << 1 ^ value >> 31) >>> 0);
    };

    function writeVarint64(val, buf, pos) {
        while (val.hi) {
            buf[pos++] = val.lo & 127 | 128;
            val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
            val.hi >>>= 7;
        }
        while (val.lo > 127) {
            buf[pos++] = val.lo & 127 | 128;
            val.lo = val.lo >>> 7;
        }
        buf[pos++] = val.lo;
    }

    /**
     * Writes an unsigned 64 bit value as a varint.
     * @param {Long|number|string} value Value to write
     * @returns {Writer} `this`
     * @throws {TypeError} If `value` is a string and no long library is present.
     */
    Writer.prototype.uint64 = function write_uint64(value) {
        var bits = LongBits$1.from(value);
        return this._push(writeVarint64, bits.length(), bits);
    };

    /**
     * Writes a signed 64 bit value as a varint.
     * @function
     * @param {Long|number|string} value Value to write
     * @returns {Writer} `this`
     * @throws {TypeError} If `value` is a string and no long library is present.
     */
    Writer.prototype.int64 = Writer.prototype.uint64;

    /**
     * Writes a signed 64 bit value as a varint, zig-zag encoded.
     * @param {Long|number|string} value Value to write
     * @returns {Writer} `this`
     * @throws {TypeError} If `value` is a string and no long library is present.
     */
    Writer.prototype.sint64 = function write_sint64(value) {
        var bits = LongBits$1.from(value).zzEncode();
        return this._push(writeVarint64, bits.length(), bits);
    };

    /**
     * Writes a boolish value as a varint.
     * @param {boolean} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.bool = function write_bool(value) {
        return this._push(writeByte, 1, value ? 1 : 0);
    };

    function writeFixed32(val, buf, pos) {
        buf[pos    ] =  val         & 255;
        buf[pos + 1] =  val >>> 8   & 255;
        buf[pos + 2] =  val >>> 16  & 255;
        buf[pos + 3] =  val >>> 24;
    }

    /**
     * Writes an unsigned 32 bit value as fixed 32 bits.
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.fixed32 = function write_fixed32(value) {
        return this._push(writeFixed32, 4, value >>> 0);
    };

    /**
     * Writes a signed 32 bit value as fixed 32 bits.
     * @function
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.sfixed32 = Writer.prototype.fixed32;

    /**
     * Writes an unsigned 64 bit value as fixed 64 bits.
     * @param {Long|number|string} value Value to write
     * @returns {Writer} `this`
     * @throws {TypeError} If `value` is a string and no long library is present.
     */
    Writer.prototype.fixed64 = function write_fixed64(value) {
        var bits = LongBits$1.from(value);
        return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
    };

    /**
     * Writes a signed 64 bit value as fixed 64 bits.
     * @function
     * @param {Long|number|string} value Value to write
     * @returns {Writer} `this`
     * @throws {TypeError} If `value` is a string and no long library is present.
     */
    Writer.prototype.sfixed64 = Writer.prototype.fixed64;

    /**
     * Writes a float (32 bit).
     * @function
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.float = function write_float(value) {
        return this._push(minimal.float.writeFloatLE, 4, value);
    };

    /**
     * Writes a double (64 bit float).
     * @function
     * @param {number} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.double = function write_double(value) {
        return this._push(minimal.float.writeDoubleLE, 8, value);
    };

    var writeBytes = minimal.Array.prototype.set
        ? function writeBytes_set(val, buf, pos) {
            buf.set(val, pos); // also works for plain array values
        }
        /* istanbul ignore next */
        : function writeBytes_for(val, buf, pos) {
            for (var i = 0; i < val.length; ++i)
                buf[pos + i] = val[i];
        };

    /**
     * Writes a sequence of bytes.
     * @param {Uint8Array|string} value Buffer or base64 encoded string to write
     * @returns {Writer} `this`
     */
    Writer.prototype.bytes = function write_bytes(value) {
        var len = value.length >>> 0;
        if (!len)
            return this._push(writeByte, 1, 0);
        if (minimal.isString(value)) {
            var buf = Writer.alloc(len = base64.length(value));
            base64.decode(value, buf, 0);
            value = buf;
        }
        return this.uint32(len)._push(writeBytes, len, value);
    };

    /**
     * Writes a string.
     * @param {string} value Value to write
     * @returns {Writer} `this`
     */
    Writer.prototype.string = function write_string(value) {
        var len = utf8.length(value);
        return len
            ? this.uint32(len)._push(utf8.write, len, value)
            : this._push(writeByte, 1, 0);
    };

    /**
     * Forks this writer's state by pushing it to a stack.
     * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
     * @returns {Writer} `this`
     */
    Writer.prototype.fork = function fork() {
        this.states = new State(this);
        this.head = this.tail = new Op(noop$1, 0, 0);
        this.len = 0;
        return this;
    };

    /**
     * Resets this instance to the last state.
     * @returns {Writer} `this`
     */
    Writer.prototype.reset = function reset() {
        if (this.states) {
            this.head   = this.states.head;
            this.tail   = this.states.tail;
            this.len    = this.states.len;
            this.states = this.states.next;
        } else {
            this.head = this.tail = new Op(noop$1, 0, 0);
            this.len  = 0;
        }
        return this;
    };

    /**
     * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
     * @returns {Writer} `this`
     */
    Writer.prototype.ldelim = function ldelim() {
        var head = this.head,
            tail = this.tail,
            len  = this.len;
        this.reset().uint32(len);
        if (len) {
            this.tail.next = head.next; // skip noop
            this.tail = tail;
            this.len += len;
        }
        return this;
    };

    /**
     * Finishes the write operation.
     * @returns {Uint8Array} Finished buffer
     */
    Writer.prototype.finish = function finish() {
        var head = this.head.next, // skip noop
            buf  = this.constructor.alloc(this.len),
            pos  = 0;
        while (head) {
            head.fn(head.val, buf, pos);
            pos += head.len;
            head = head.next;
        }
        // this.head = this.tail = null;
        return buf;
    };

    Writer._configure = function(BufferWriter_) {
        BufferWriter = BufferWriter_;
    };

    var writer_buffer = BufferWriter$1;

    // extends Writer

    (BufferWriter$1.prototype = Object.create(writer.prototype)).constructor = BufferWriter$1;



    var Buffer$1 = minimal.Buffer;

    /**
     * Constructs a new buffer writer instance.
     * @classdesc Wire format writer using node buffers.
     * @extends Writer
     * @constructor
     */
    function BufferWriter$1() {
        writer.call(this);
    }

    /**
     * Allocates a buffer of the specified size.
     * @param {number} size Buffer size
     * @returns {Buffer} Buffer
     */
    BufferWriter$1.alloc = function alloc_buffer(size) {
        return (BufferWriter$1.alloc = minimal._Buffer_allocUnsafe)(size);
    };

    var writeBytesBuffer = Buffer$1 && Buffer$1.prototype instanceof Uint8Array && Buffer$1.prototype.set.name === "set"
        ? function writeBytesBuffer_set(val, buf, pos) {
            buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
                               // also works for plain array values
        }
        /* istanbul ignore next */
        : function writeBytesBuffer_copy(val, buf, pos) {
            if (val.copy) // Buffer values
                val.copy(buf, pos, 0, val.length);
            else for (var i = 0; i < val.length;) // plain array values
                buf[pos++] = val[i++];
        };

    /**
     * @override
     */
    BufferWriter$1.prototype.bytes = function write_bytes_buffer(value) {
        if (minimal.isString(value))
            value = minimal._Buffer_from(value, "base64");
        var len = value.length >>> 0;
        this.uint32(len);
        if (len)
            this._push(writeBytesBuffer, len, value);
        return this;
    };

    function writeStringBuffer(val, buf, pos) {
        if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
            minimal.utf8.write(val, buf, pos);
        else
            buf.utf8Write(val, pos);
    }

    /**
     * @override
     */
    BufferWriter$1.prototype.string = function write_string_buffer(value) {
        var len = Buffer$1.byteLength(value);
        this.uint32(len);
        if (len)
            this._push(writeStringBuffer, len, value);
        return this;
    };

    var reader = Reader;



    var BufferReader; // cyclic

    var LongBits$2  = minimal.LongBits,
        utf8$1      = minimal.utf8;

    /* istanbul ignore next */
    function indexOutOfRange(reader, writeLength) {
        return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
    }

    /**
     * Constructs a new reader instance using the specified buffer.
     * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
     * @constructor
     * @param {Uint8Array} buffer Buffer to read from
     */
    function Reader(buffer) {

        /**
         * Read buffer.
         * @type {Uint8Array}
         */
        this.buf = buffer;

        /**
         * Read buffer position.
         * @type {number}
         */
        this.pos = 0;

        /**
         * Read buffer length.
         * @type {number}
         */
        this.len = buffer.length;
    }

    var create_array = typeof Uint8Array !== "undefined"
        ? function create_typed_array(buffer) {
            if (buffer instanceof Uint8Array || Array.isArray(buffer))
                return new Reader(buffer);
            throw Error("illegal buffer");
        }
        /* istanbul ignore next */
        : function create_array(buffer) {
            if (Array.isArray(buffer))
                return new Reader(buffer);
            throw Error("illegal buffer");
        };

    /**
     * Creates a new reader using the specified buffer.
     * @function
     * @param {Uint8Array|Buffer} buffer Buffer to read from
     * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
     * @throws {Error} If `buffer` is not a valid buffer
     */
    Reader.create = minimal.Buffer
        ? function create_buffer_setup(buffer) {
            return (Reader.create = function create_buffer(buffer) {
                return minimal.Buffer.isBuffer(buffer)
                    ? new BufferReader(buffer)
                    /* istanbul ignore next */
                    : create_array(buffer);
            })(buffer);
        }
        /* istanbul ignore next */
        : create_array;

    Reader.prototype._slice = minimal.Array.prototype.subarray || /* istanbul ignore next */ minimal.Array.prototype.slice;

    /**
     * Reads a varint as an unsigned 32 bit value.
     * @function
     * @returns {number} Value read
     */
    Reader.prototype.uint32 = (function read_uint32_setup() {
        var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
        return function read_uint32() {
            value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
            value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;

            /* istanbul ignore if */
            if ((this.pos += 5) > this.len) {
                this.pos = this.len;
                throw indexOutOfRange(this, 10);
            }
            return value;
        };
    })();

    /**
     * Reads a varint as a signed 32 bit value.
     * @returns {number} Value read
     */
    Reader.prototype.int32 = function read_int32() {
        return this.uint32() | 0;
    };

    /**
     * Reads a zig-zag encoded varint as a signed 32 bit value.
     * @returns {number} Value read
     */
    Reader.prototype.sint32 = function read_sint32() {
        var value = this.uint32();
        return value >>> 1 ^ -(value & 1) | 0;
    };

    /* eslint-disable no-invalid-this */

    function readLongVarint() {
        // tends to deopt with local vars for octet etc.
        var bits = new LongBits$2(0, 0);
        var i = 0;
        if (this.len - this.pos > 4) { // fast route (lo)
            for (; i < 4; ++i) {
                // 1st..4th
                bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
                if (this.buf[this.pos++] < 128)
                    return bits;
            }
            // 5th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
            i = 0;
        } else {
            for (; i < 3; ++i) {
                /* istanbul ignore if */
                if (this.pos >= this.len)
                    throw indexOutOfRange(this);
                // 1st..3th
                bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
                if (this.buf[this.pos++] < 128)
                    return bits;
            }
            // 4th
            bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
            return bits;
        }
        if (this.len - this.pos > 4) { // fast route (hi)
            for (; i < 5; ++i) {
                // 6th..10th
                bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
                if (this.buf[this.pos++] < 128)
                    return bits;
            }
        } else {
            for (; i < 5; ++i) {
                /* istanbul ignore if */
                if (this.pos >= this.len)
                    throw indexOutOfRange(this);
                // 6th..10th
                bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
                if (this.buf[this.pos++] < 128)
                    return bits;
            }
        }
        /* istanbul ignore next */
        throw Error("invalid varint encoding");
    }

    /* eslint-enable no-invalid-this */

    /**
     * Reads a varint as a signed 64 bit value.
     * @name Reader#int64
     * @function
     * @returns {Long} Value read
     */

    /**
     * Reads a varint as an unsigned 64 bit value.
     * @name Reader#uint64
     * @function
     * @returns {Long} Value read
     */

    /**
     * Reads a zig-zag encoded varint as a signed 64 bit value.
     * @name Reader#sint64
     * @function
     * @returns {Long} Value read
     */

    /**
     * Reads a varint as a boolean.
     * @returns {boolean} Value read
     */
    Reader.prototype.bool = function read_bool() {
        return this.uint32() !== 0;
    };

    function readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
        return (buf[end - 4]
              | buf[end - 3] << 8
              | buf[end - 2] << 16
              | buf[end - 1] << 24) >>> 0;
    }

    /**
     * Reads fixed 32 bits as an unsigned 32 bit integer.
     * @returns {number} Value read
     */
    Reader.prototype.fixed32 = function read_fixed32() {

        /* istanbul ignore if */
        if (this.pos + 4 > this.len)
            throw indexOutOfRange(this, 4);

        return readFixed32_end(this.buf, this.pos += 4);
    };

    /**
     * Reads fixed 32 bits as a signed 32 bit integer.
     * @returns {number} Value read
     */
    Reader.prototype.sfixed32 = function read_sfixed32() {

        /* istanbul ignore if */
        if (this.pos + 4 > this.len)
            throw indexOutOfRange(this, 4);

        return readFixed32_end(this.buf, this.pos += 4) | 0;
    };

    /* eslint-disable no-invalid-this */

    function readFixed64(/* this: Reader */) {

        /* istanbul ignore if */
        if (this.pos + 8 > this.len)
            throw indexOutOfRange(this, 8);

        return new LongBits$2(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
    }

    /* eslint-enable no-invalid-this */

    /**
     * Reads fixed 64 bits.
     * @name Reader#fixed64
     * @function
     * @returns {Long} Value read
     */

    /**
     * Reads zig-zag encoded fixed 64 bits.
     * @name Reader#sfixed64
     * @function
     * @returns {Long} Value read
     */

    /**
     * Reads a float (32 bit) as a number.
     * @function
     * @returns {number} Value read
     */
    Reader.prototype.float = function read_float() {

        /* istanbul ignore if */
        if (this.pos + 4 > this.len)
            throw indexOutOfRange(this, 4);

        var value = minimal.float.readFloatLE(this.buf, this.pos);
        this.pos += 4;
        return value;
    };

    /**
     * Reads a double (64 bit float) as a number.
     * @function
     * @returns {number} Value read
     */
    Reader.prototype.double = function read_double() {

        /* istanbul ignore if */
        if (this.pos + 8 > this.len)
            throw indexOutOfRange(this, 4);

        var value = minimal.float.readDoubleLE(this.buf, this.pos);
        this.pos += 8;
        return value;
    };

    /**
     * Reads a sequence of bytes preceeded by its length as a varint.
     * @returns {Uint8Array} Value read
     */
    Reader.prototype.bytes = function read_bytes() {
        var length = this.uint32(),
            start  = this.pos,
            end    = this.pos + length;

        /* istanbul ignore if */
        if (end > this.len)
            throw indexOutOfRange(this, length);

        this.pos += length;
        if (Array.isArray(this.buf)) // plain array
            return this.buf.slice(start, end);
        return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
            ? new this.buf.constructor(0)
            : this._slice.call(this.buf, start, end);
    };

    /**
     * Reads a string preceeded by its byte length as a varint.
     * @returns {string} Value read
     */
    Reader.prototype.string = function read_string() {
        var bytes = this.bytes();
        return utf8$1.read(bytes, 0, bytes.length);
    };

    /**
     * Skips the specified number of bytes if specified, otherwise skips a varint.
     * @param {number} [length] Length if known, otherwise a varint is assumed
     * @returns {Reader} `this`
     */
    Reader.prototype.skip = function skip(length) {
        if (typeof length === "number") {
            /* istanbul ignore if */
            if (this.pos + length > this.len)
                throw indexOutOfRange(this, length);
            this.pos += length;
        } else {
            do {
                /* istanbul ignore if */
                if (this.pos >= this.len)
                    throw indexOutOfRange(this);
            } while (this.buf[this.pos++] & 128);
        }
        return this;
    };

    /**
     * Skips the next element of the specified wire type.
     * @param {number} wireType Wire type received
     * @returns {Reader} `this`
     */
    Reader.prototype.skipType = function(wireType) {
        switch (wireType) {
            case 0:
                this.skip();
                break;
            case 1:
                this.skip(8);
                break;
            case 2:
                this.skip(this.uint32());
                break;
            case 3:
                while ((wireType = this.uint32() & 7) !== 4) {
                    this.skipType(wireType);
                }
                break;
            case 5:
                this.skip(4);
                break;

            /* istanbul ignore next */
            default:
                throw Error("invalid wire type " + wireType + " at offset " + this.pos);
        }
        return this;
    };

    Reader._configure = function(BufferReader_) {
        BufferReader = BufferReader_;

        var fn = minimal.Long ? "toLong" : /* istanbul ignore next */ "toNumber";
        minimal.merge(Reader.prototype, {

            int64: function read_int64() {
                return readLongVarint.call(this)[fn](false);
            },

            uint64: function read_uint64() {
                return readLongVarint.call(this)[fn](true);
            },

            sint64: function read_sint64() {
                return readLongVarint.call(this).zzDecode()[fn](false);
            },

            fixed64: function read_fixed64() {
                return readFixed64.call(this)[fn](true);
            },

            sfixed64: function read_sfixed64() {
                return readFixed64.call(this)[fn](false);
            }

        });
    };

    var reader_buffer = BufferReader$1;

    // extends Reader

    (BufferReader$1.prototype = Object.create(reader.prototype)).constructor = BufferReader$1;



    /**
     * Constructs a new buffer reader instance.
     * @classdesc Wire format reader using node buffers.
     * @extends Reader
     * @constructor
     * @param {Buffer} buffer Buffer to read from
     */
    function BufferReader$1(buffer) {
        reader.call(this, buffer);

        /**
         * Read buffer.
         * @name BufferReader#buf
         * @type {Buffer}
         */
    }

    /* istanbul ignore else */
    if (minimal.Buffer)
        BufferReader$1.prototype._slice = minimal.Buffer.prototype.slice;

    /**
     * @override
     */
    BufferReader$1.prototype.string = function read_string_buffer() {
        var len = this.uint32(); // modifies pos
        return this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len));
    };

    var service = Service;



    // Extends EventEmitter
    (Service.prototype = Object.create(minimal.EventEmitter.prototype)).constructor = Service;

    /**
     * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
     *
     * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
     * @typedef rpc.ServiceMethodCallback
     * @template TRes extends Message<TRes>
     * @type {function}
     * @param {Error|null} error Error, if any
     * @param {TRes} [response] Response message
     * @returns {undefined}
     */

    /**
     * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
     * @typedef rpc.ServiceMethod
     * @template TReq extends Message<TReq>
     * @template TRes extends Message<TRes>
     * @type {function}
     * @param {TReq|Properties<TReq>} request Request message or plain object
     * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
     * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
     */

    /**
     * Constructs a new RPC service instance.
     * @classdesc An RPC service as returned by {@link Service#create}.
     * @exports rpc.Service
     * @extends util.EventEmitter
     * @constructor
     * @param {RPCImpl} rpcImpl RPC implementation
     * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
     * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
     */
    function Service(rpcImpl, requestDelimited, responseDelimited) {

        if (typeof rpcImpl !== "function")
            throw TypeError("rpcImpl must be a function");

        minimal.EventEmitter.call(this);

        /**
         * RPC implementation. Becomes `null` once the service is ended.
         * @type {RPCImpl|null}
         */
        this.rpcImpl = rpcImpl;

        /**
         * Whether requests are length-delimited.
         * @type {boolean}
         */
        this.requestDelimited = Boolean(requestDelimited);

        /**
         * Whether responses are length-delimited.
         * @type {boolean}
         */
        this.responseDelimited = Boolean(responseDelimited);
    }

    /**
     * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
     * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
     * @param {Constructor<TReq>} requestCtor Request constructor
     * @param {Constructor<TRes>} responseCtor Response constructor
     * @param {TReq|Properties<TReq>} request Request message or plain object
     * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
     * @returns {undefined}
     * @template TReq extends Message<TReq>
     * @template TRes extends Message<TRes>
     */
    Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

        if (!request)
            throw TypeError("request must be specified");

        var self = this;
        if (!callback)
            return minimal.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

        if (!self.rpcImpl) {
            setTimeout(function() { callback(Error("already ended")); }, 0);
            return undefined;
        }

        try {
            return self.rpcImpl(
                method,
                requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
                function rpcCallback(err, response) {

                    if (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }

                    if (response === null) {
                        self.end(/* endedByRPC */ true);
                        return undefined;
                    }

                    if (!(response instanceof responseCtor)) {
                        try {
                            response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                        } catch (err) {
                            self.emit("error", err, method);
                            return callback(err);
                        }
                    }

                    self.emit("data", response, method);
                    return callback(null, response);
                }
            );
        } catch (err) {
            self.emit("error", err, method);
            setTimeout(function() { callback(err); }, 0);
            return undefined;
        }
    };

    /**
     * Ends this service and emits the `end` event.
     * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
     * @returns {rpc.Service} `this`
     */
    Service.prototype.end = function end(endedByRPC) {
        if (this.rpcImpl) {
            if (!endedByRPC) // signal end to rpcImpl
                this.rpcImpl(null, null, null);
            this.rpcImpl = null;
            this.emit("end").off();
        }
        return this;
    };

    var rpc_1 = createCommonjsModule(function (module, exports) {

    /**
     * Streaming RPC helpers.
     * @namespace
     */
    var rpc = exports;

    /**
     * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
     * @typedef RPCImpl
     * @type {function}
     * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
     * @param {Uint8Array} requestData Request data
     * @param {RPCImplCallback} callback Callback function
     * @returns {undefined}
     * @example
     * function rpcImpl(method, requestData, callback) {
     *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
     *         throw Error("no such method");
     *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
     *         callback(err, responseData);
     *     });
     * }
     */

    /**
     * Node-style callback as used by {@link RPCImpl}.
     * @typedef RPCImplCallback
     * @type {function}
     * @param {Error|null} error Error, if any, otherwise `null`
     * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
     * @returns {undefined}
     */

    rpc.Service = service;
    });

    var roots = {};

    var indexMinimal = createCommonjsModule(function (module, exports) {
    var protobuf = exports;

    /**
     * Build type, one of `"full"`, `"light"` or `"minimal"`.
     * @name build
     * @type {string}
     * @const
     */
    protobuf.build = "minimal";

    // Serialization
    protobuf.Writer       = writer;
    protobuf.BufferWriter = writer_buffer;
    protobuf.Reader       = reader;
    protobuf.BufferReader = reader_buffer;

    // Utility
    protobuf.util         = minimal;
    protobuf.rpc          = rpc_1;
    protobuf.roots        = roots;
    protobuf.configure    = configure;

    /* istanbul ignore next */
    /**
     * Reconfigures the library according to the environment.
     * @returns {undefined}
     */
    function configure() {
        protobuf.Reader._configure(protobuf.BufferReader);
        protobuf.util._configure();
    }

    // Set up buffer utility according to the environment
    protobuf.Writer._configure(protobuf.BufferWriter);
    configure();
    });

    var minimal$1 = indexMinimal;

    // Common aliases
    var $Reader = minimal$1.Reader, $Writer = minimal$1.Writer, $util = minimal$1.util;

    // Exported root namespace
    var $root = minimal$1.roots["default"] || (minimal$1.roots["default"] = {});

    $root.chefmoji = (function() {

        /**
         * Namespace chefmoji.
         * @exports chefmoji
         * @namespace
         */
        var chefmoji = {};

        chefmoji.MapRow = (function() {

            /**
             * Properties of a MapRow.
             * @memberof chefmoji
             * @interface IMapRow
             * @property {Array.<string>|null} [row] MapRow row
             */

            /**
             * Constructs a new MapRow.
             * @memberof chefmoji
             * @classdesc Represents a MapRow.
             * @implements IMapRow
             * @constructor
             * @param {chefmoji.IMapRow=} [properties] Properties to set
             */
            function MapRow(properties) {
                this.row = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MapRow row.
             * @member {Array.<string>} row
             * @memberof chefmoji.MapRow
             * @instance
             */
            MapRow.prototype.row = $util.emptyArray;

            /**
             * Creates a new MapRow instance using the specified properties.
             * @function create
             * @memberof chefmoji.MapRow
             * @static
             * @param {chefmoji.IMapRow=} [properties] Properties to set
             * @returns {chefmoji.MapRow} MapRow instance
             */
            MapRow.create = function create(properties) {
                return new MapRow(properties);
            };

            /**
             * Encodes the specified MapRow message. Does not implicitly {@link chefmoji.MapRow.verify|verify} messages.
             * @function encode
             * @memberof chefmoji.MapRow
             * @static
             * @param {chefmoji.IMapRow} message MapRow message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MapRow.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.row != null && message.row.length)
                    for (var i = 0; i < message.row.length; ++i)
                        writer.uint32(/* id 1, wireType 2 =*/10).string(message.row[i]);
                return writer;
            };

            /**
             * Encodes the specified MapRow message, length delimited. Does not implicitly {@link chefmoji.MapRow.verify|verify} messages.
             * @function encodeDelimited
             * @memberof chefmoji.MapRow
             * @static
             * @param {chefmoji.IMapRow} message MapRow message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MapRow.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MapRow message from the specified reader or buffer.
             * @function decode
             * @memberof chefmoji.MapRow
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {chefmoji.MapRow} MapRow
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MapRow.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.chefmoji.MapRow();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.row && message.row.length))
                            message.row = [];
                        message.row.push(reader.string());
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MapRow message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof chefmoji.MapRow
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {chefmoji.MapRow} MapRow
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MapRow.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MapRow message.
             * @function verify
             * @memberof chefmoji.MapRow
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MapRow.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.row != null && message.hasOwnProperty("row")) {
                    if (!Array.isArray(message.row))
                        return "row: array expected";
                    for (var i = 0; i < message.row.length; ++i)
                        if (!$util.isString(message.row[i]))
                            return "row: string[] expected";
                }
                return null;
            };

            /**
             * Creates a MapRow message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof chefmoji.MapRow
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {chefmoji.MapRow} MapRow
             */
            MapRow.fromObject = function fromObject(object) {
                if (object instanceof $root.chefmoji.MapRow)
                    return object;
                var message = new $root.chefmoji.MapRow();
                if (object.row) {
                    if (!Array.isArray(object.row))
                        throw TypeError(".chefmoji.MapRow.row: array expected");
                    message.row = [];
                    for (var i = 0; i < object.row.length; ++i)
                        message.row[i] = String(object.row[i]);
                }
                return message;
            };

            /**
             * Creates a plain object from a MapRow message. Also converts values to other types if specified.
             * @function toObject
             * @memberof chefmoji.MapRow
             * @static
             * @param {chefmoji.MapRow} message MapRow
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MapRow.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.row = [];
                if (message.row && message.row.length) {
                    object.row = [];
                    for (var j = 0; j < message.row.length; ++j)
                        object.row[j] = message.row[j];
                }
                return object;
            };

            /**
             * Converts this MapRow to JSON.
             * @function toJSON
             * @memberof chefmoji.MapRow
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MapRow.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, minimal$1.util.toJSONOptions);
            };

            return MapRow;
        })();

        chefmoji.MapUpdate = (function() {

            /**
             * Properties of a MapUpdate.
             * @memberof chefmoji
             * @interface IMapUpdate
             * @property {Array.<chefmoji.IMapRow>|null} [map] MapUpdate map
             * @property {Array.<chefmoji.IPlayerUpdate>|null} [players] MapUpdate players
             * @property {Array.<chefmoji.IOrderUpdate>|null} [order] MapUpdate order
             */

            /**
             * Constructs a new MapUpdate.
             * @memberof chefmoji
             * @classdesc Represents a MapUpdate.
             * @implements IMapUpdate
             * @constructor
             * @param {chefmoji.IMapUpdate=} [properties] Properties to set
             */
            function MapUpdate(properties) {
                this.map = [];
                this.players = [];
                this.order = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * MapUpdate map.
             * @member {Array.<chefmoji.IMapRow>} map
             * @memberof chefmoji.MapUpdate
             * @instance
             */
            MapUpdate.prototype.map = $util.emptyArray;

            /**
             * MapUpdate players.
             * @member {Array.<chefmoji.IPlayerUpdate>} players
             * @memberof chefmoji.MapUpdate
             * @instance
             */
            MapUpdate.prototype.players = $util.emptyArray;

            /**
             * MapUpdate order.
             * @member {Array.<chefmoji.IOrderUpdate>} order
             * @memberof chefmoji.MapUpdate
             * @instance
             */
            MapUpdate.prototype.order = $util.emptyArray;

            /**
             * Creates a new MapUpdate instance using the specified properties.
             * @function create
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {chefmoji.IMapUpdate=} [properties] Properties to set
             * @returns {chefmoji.MapUpdate} MapUpdate instance
             */
            MapUpdate.create = function create(properties) {
                return new MapUpdate(properties);
            };

            /**
             * Encodes the specified MapUpdate message. Does not implicitly {@link chefmoji.MapUpdate.verify|verify} messages.
             * @function encode
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {chefmoji.IMapUpdate} message MapUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MapUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.map != null && message.map.length)
                    for (var i = 0; i < message.map.length; ++i)
                        $root.chefmoji.MapRow.encode(message.map[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                if (message.players != null && message.players.length)
                    for (var i = 0; i < message.players.length; ++i)
                        $root.chefmoji.PlayerUpdate.encode(message.players[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                if (message.order != null && message.order.length)
                    for (var i = 0; i < message.order.length; ++i)
                        $root.chefmoji.OrderUpdate.encode(message.order[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                return writer;
            };

            /**
             * Encodes the specified MapUpdate message, length delimited. Does not implicitly {@link chefmoji.MapUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {chefmoji.IMapUpdate} message MapUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            MapUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a MapUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {chefmoji.MapUpdate} MapUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MapUpdate.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.chefmoji.MapUpdate();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.map && message.map.length))
                            message.map = [];
                        message.map.push($root.chefmoji.MapRow.decode(reader, reader.uint32()));
                        break;
                    case 2:
                        if (!(message.players && message.players.length))
                            message.players = [];
                        message.players.push($root.chefmoji.PlayerUpdate.decode(reader, reader.uint32()));
                        break;
                    case 3:
                        if (!(message.order && message.order.length))
                            message.order = [];
                        message.order.push($root.chefmoji.OrderUpdate.decode(reader, reader.uint32()));
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a MapUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {chefmoji.MapUpdate} MapUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            MapUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a MapUpdate message.
             * @function verify
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            MapUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.map != null && message.hasOwnProperty("map")) {
                    if (!Array.isArray(message.map))
                        return "map: array expected";
                    for (var i = 0; i < message.map.length; ++i) {
                        var error = $root.chefmoji.MapRow.verify(message.map[i]);
                        if (error)
                            return "map." + error;
                    }
                }
                if (message.players != null && message.hasOwnProperty("players")) {
                    if (!Array.isArray(message.players))
                        return "players: array expected";
                    for (var i = 0; i < message.players.length; ++i) {
                        var error = $root.chefmoji.PlayerUpdate.verify(message.players[i]);
                        if (error)
                            return "players." + error;
                    }
                }
                if (message.order != null && message.hasOwnProperty("order")) {
                    if (!Array.isArray(message.order))
                        return "order: array expected";
                    for (var i = 0; i < message.order.length; ++i) {
                        var error = $root.chefmoji.OrderUpdate.verify(message.order[i]);
                        if (error)
                            return "order." + error;
                    }
                }
                return null;
            };

            /**
             * Creates a MapUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {chefmoji.MapUpdate} MapUpdate
             */
            MapUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.chefmoji.MapUpdate)
                    return object;
                var message = new $root.chefmoji.MapUpdate();
                if (object.map) {
                    if (!Array.isArray(object.map))
                        throw TypeError(".chefmoji.MapUpdate.map: array expected");
                    message.map = [];
                    for (var i = 0; i < object.map.length; ++i) {
                        if (typeof object.map[i] !== "object")
                            throw TypeError(".chefmoji.MapUpdate.map: object expected");
                        message.map[i] = $root.chefmoji.MapRow.fromObject(object.map[i]);
                    }
                }
                if (object.players) {
                    if (!Array.isArray(object.players))
                        throw TypeError(".chefmoji.MapUpdate.players: array expected");
                    message.players = [];
                    for (var i = 0; i < object.players.length; ++i) {
                        if (typeof object.players[i] !== "object")
                            throw TypeError(".chefmoji.MapUpdate.players: object expected");
                        message.players[i] = $root.chefmoji.PlayerUpdate.fromObject(object.players[i]);
                    }
                }
                if (object.order) {
                    if (!Array.isArray(object.order))
                        throw TypeError(".chefmoji.MapUpdate.order: array expected");
                    message.order = [];
                    for (var i = 0; i < object.order.length; ++i) {
                        if (typeof object.order[i] !== "object")
                            throw TypeError(".chefmoji.MapUpdate.order: object expected");
                        message.order[i] = $root.chefmoji.OrderUpdate.fromObject(object.order[i]);
                    }
                }
                return message;
            };

            /**
             * Creates a plain object from a MapUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof chefmoji.MapUpdate
             * @static
             * @param {chefmoji.MapUpdate} message MapUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            MapUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults) {
                    object.map = [];
                    object.players = [];
                    object.order = [];
                }
                if (message.map && message.map.length) {
                    object.map = [];
                    for (var j = 0; j < message.map.length; ++j)
                        object.map[j] = $root.chefmoji.MapRow.toObject(message.map[j], options);
                }
                if (message.players && message.players.length) {
                    object.players = [];
                    for (var j = 0; j < message.players.length; ++j)
                        object.players[j] = $root.chefmoji.PlayerUpdate.toObject(message.players[j], options);
                }
                if (message.order && message.order.length) {
                    object.order = [];
                    for (var j = 0; j < message.order.length; ++j)
                        object.order[j] = $root.chefmoji.OrderUpdate.toObject(message.order[j], options);
                }
                return object;
            };

            /**
             * Converts this MapUpdate to JSON.
             * @function toJSON
             * @memberof chefmoji.MapUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            MapUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, minimal$1.util.toJSONOptions);
            };

            return MapUpdate;
        })();

        chefmoji.PlayerUpdate = (function() {

            /**
             * Properties of a PlayerUpdate.
             * @memberof chefmoji
             * @interface IPlayerUpdate
             * @property {Array.<number>|null} [position] PlayerUpdate position
             * @property {string|null} [inventory] PlayerUpdate inventory
             * @property {string|null} [id] PlayerUpdate id
             */

            /**
             * Constructs a new PlayerUpdate.
             * @memberof chefmoji
             * @classdesc Represents a PlayerUpdate.
             * @implements IPlayerUpdate
             * @constructor
             * @param {chefmoji.IPlayerUpdate=} [properties] Properties to set
             */
            function PlayerUpdate(properties) {
                this.position = [];
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PlayerUpdate position.
             * @member {Array.<number>} position
             * @memberof chefmoji.PlayerUpdate
             * @instance
             */
            PlayerUpdate.prototype.position = $util.emptyArray;

            /**
             * PlayerUpdate inventory.
             * @member {string} inventory
             * @memberof chefmoji.PlayerUpdate
             * @instance
             */
            PlayerUpdate.prototype.inventory = "";

            /**
             * PlayerUpdate id.
             * @member {string} id
             * @memberof chefmoji.PlayerUpdate
             * @instance
             */
            PlayerUpdate.prototype.id = "";

            /**
             * Creates a new PlayerUpdate instance using the specified properties.
             * @function create
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {chefmoji.IPlayerUpdate=} [properties] Properties to set
             * @returns {chefmoji.PlayerUpdate} PlayerUpdate instance
             */
            PlayerUpdate.create = function create(properties) {
                return new PlayerUpdate(properties);
            };

            /**
             * Encodes the specified PlayerUpdate message. Does not implicitly {@link chefmoji.PlayerUpdate.verify|verify} messages.
             * @function encode
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {chefmoji.IPlayerUpdate} message PlayerUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlayerUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.position != null && message.position.length) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork();
                    for (var i = 0; i < message.position.length; ++i)
                        writer.uint32(message.position[i]);
                    writer.ldelim();
                }
                if (message.inventory != null && message.hasOwnProperty("inventory"))
                    writer.uint32(/* id 2, wireType 2 =*/18).string(message.inventory);
                if (message.id != null && message.hasOwnProperty("id"))
                    writer.uint32(/* id 3, wireType 2 =*/26).string(message.id);
                return writer;
            };

            /**
             * Encodes the specified PlayerUpdate message, length delimited. Does not implicitly {@link chefmoji.PlayerUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {chefmoji.IPlayerUpdate} message PlayerUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlayerUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PlayerUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {chefmoji.PlayerUpdate} PlayerUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlayerUpdate.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.chefmoji.PlayerUpdate();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        if (!(message.position && message.position.length))
                            message.position = [];
                        if ((tag & 7) === 2) {
                            var end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.position.push(reader.uint32());
                        } else
                            message.position.push(reader.uint32());
                        break;
                    case 2:
                        message.inventory = reader.string();
                        break;
                    case 3:
                        message.id = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PlayerUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {chefmoji.PlayerUpdate} PlayerUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlayerUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PlayerUpdate message.
             * @function verify
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PlayerUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.position != null && message.hasOwnProperty("position")) {
                    if (!Array.isArray(message.position))
                        return "position: array expected";
                    for (var i = 0; i < message.position.length; ++i)
                        if (!$util.isInteger(message.position[i]))
                            return "position: integer[] expected";
                }
                if (message.inventory != null && message.hasOwnProperty("inventory"))
                    if (!$util.isString(message.inventory))
                        return "inventory: string expected";
                if (message.id != null && message.hasOwnProperty("id"))
                    if (!$util.isString(message.id))
                        return "id: string expected";
                return null;
            };

            /**
             * Creates a PlayerUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {chefmoji.PlayerUpdate} PlayerUpdate
             */
            PlayerUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.chefmoji.PlayerUpdate)
                    return object;
                var message = new $root.chefmoji.PlayerUpdate();
                if (object.position) {
                    if (!Array.isArray(object.position))
                        throw TypeError(".chefmoji.PlayerUpdate.position: array expected");
                    message.position = [];
                    for (var i = 0; i < object.position.length; ++i)
                        message.position[i] = object.position[i] >>> 0;
                }
                if (object.inventory != null)
                    message.inventory = String(object.inventory);
                if (object.id != null)
                    message.id = String(object.id);
                return message;
            };

            /**
             * Creates a plain object from a PlayerUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof chefmoji.PlayerUpdate
             * @static
             * @param {chefmoji.PlayerUpdate} message PlayerUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PlayerUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.arrays || options.defaults)
                    object.position = [];
                if (options.defaults) {
                    object.inventory = "";
                    object.id = "";
                }
                if (message.position && message.position.length) {
                    object.position = [];
                    for (var j = 0; j < message.position.length; ++j)
                        object.position[j] = message.position[j];
                }
                if (message.inventory != null && message.hasOwnProperty("inventory"))
                    object.inventory = message.inventory;
                if (message.id != null && message.hasOwnProperty("id"))
                    object.id = message.id;
                return object;
            };

            /**
             * Converts this PlayerUpdate to JSON.
             * @function toJSON
             * @memberof chefmoji.PlayerUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PlayerUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, minimal$1.util.toJSONOptions);
            };

            return PlayerUpdate;
        })();

        /**
         * OrderType enum.
         * @name chefmoji.OrderType
         * @enum {string}
         * @property {number} HOT_DOG=0 HOT_DOG value
         * @property {number} PIZZA=1 PIZZA value
         * @property {number} TACO=2 TACO value
         * @property {number} GYRO=3 GYRO value
         * @property {number} SANDWICH=4 SANDWICH value
         * @property {number} HAMBURGER=5 HAMBURGER value
         * @property {number} WAFFLES=6 WAFFLES value
         * @property {number} PANCAKES=7 PANCAKES value
         * @property {number} EGGS=8 EGGS value
         * @property {number} BURRITO=9 BURRITO value
         * @property {number} SUSHI=10 SUSHI value
         * @property {number} RAMEN=11 RAMEN value
         * @property {number} BENTO_BOX=12 BENTO_BOX value
         * @property {number} STEW=13 STEW value
         * @property {number} CURRY_RICE=14 CURRY_RICE value
         */
        chefmoji.OrderType = (function() {
            var valuesById = {}, values = Object.create(valuesById);
            values[valuesById[0] = "HOT_DOG"] = 0;
            values[valuesById[1] = "PIZZA"] = 1;
            values[valuesById[2] = "TACO"] = 2;
            values[valuesById[3] = "GYRO"] = 3;
            values[valuesById[4] = "SANDWICH"] = 4;
            values[valuesById[5] = "HAMBURGER"] = 5;
            values[valuesById[6] = "WAFFLES"] = 6;
            values[valuesById[7] = "PANCAKES"] = 7;
            values[valuesById[8] = "EGGS"] = 8;
            values[valuesById[9] = "BURRITO"] = 9;
            values[valuesById[10] = "SUSHI"] = 10;
            values[valuesById[11] = "RAMEN"] = 11;
            values[valuesById[12] = "BENTO_BOX"] = 12;
            values[valuesById[13] = "STEW"] = 13;
            values[valuesById[14] = "CURRY_RICE"] = 14;
            return values;
        })();

        chefmoji.OrderUpdate = (function() {

            /**
             * Properties of an OrderUpdate.
             * @memberof chefmoji
             * @interface IOrderUpdate
             * @property {number|null} [uid] OrderUpdate uid
             * @property {number|null} [registrationTime] OrderUpdate registrationTime
             * @property {chefmoji.OrderType|null} [orderType] OrderUpdate orderType
             * @property {boolean|null} [fulfilled] OrderUpdate fulfilled
             */

            /**
             * Constructs a new OrderUpdate.
             * @memberof chefmoji
             * @classdesc Represents an OrderUpdate.
             * @implements IOrderUpdate
             * @constructor
             * @param {chefmoji.IOrderUpdate=} [properties] Properties to set
             */
            function OrderUpdate(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * OrderUpdate uid.
             * @member {number} uid
             * @memberof chefmoji.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.uid = 0;

            /**
             * OrderUpdate registrationTime.
             * @member {number} registrationTime
             * @memberof chefmoji.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.registrationTime = 0;

            /**
             * OrderUpdate orderType.
             * @member {chefmoji.OrderType} orderType
             * @memberof chefmoji.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.orderType = 0;

            /**
             * OrderUpdate fulfilled.
             * @member {boolean} fulfilled
             * @memberof chefmoji.OrderUpdate
             * @instance
             */
            OrderUpdate.prototype.fulfilled = false;

            /**
             * Creates a new OrderUpdate instance using the specified properties.
             * @function create
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {chefmoji.IOrderUpdate=} [properties] Properties to set
             * @returns {chefmoji.OrderUpdate} OrderUpdate instance
             */
            OrderUpdate.create = function create(properties) {
                return new OrderUpdate(properties);
            };

            /**
             * Encodes the specified OrderUpdate message. Does not implicitly {@link chefmoji.OrderUpdate.verify|verify} messages.
             * @function encode
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {chefmoji.IOrderUpdate} message OrderUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OrderUpdate.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.uid != null && message.hasOwnProperty("uid"))
                    writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.uid);
                if (message.registrationTime != null && message.hasOwnProperty("registrationTime"))
                    writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.registrationTime);
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    writer.uint32(/* id 3, wireType 0 =*/24).int32(message.orderType);
                if (message.fulfilled != null && message.hasOwnProperty("fulfilled"))
                    writer.uint32(/* id 4, wireType 0 =*/32).bool(message.fulfilled);
                return writer;
            };

            /**
             * Encodes the specified OrderUpdate message, length delimited. Does not implicitly {@link chefmoji.OrderUpdate.verify|verify} messages.
             * @function encodeDelimited
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {chefmoji.IOrderUpdate} message OrderUpdate message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            OrderUpdate.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an OrderUpdate message from the specified reader or buffer.
             * @function decode
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {chefmoji.OrderUpdate} OrderUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OrderUpdate.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.chefmoji.OrderUpdate();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.uid = reader.uint32();
                        break;
                    case 2:
                        message.registrationTime = reader.uint32();
                        break;
                    case 3:
                        message.orderType = reader.int32();
                        break;
                    case 4:
                        message.fulfilled = reader.bool();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes an OrderUpdate message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {chefmoji.OrderUpdate} OrderUpdate
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            OrderUpdate.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an OrderUpdate message.
             * @function verify
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            OrderUpdate.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.uid != null && message.hasOwnProperty("uid"))
                    if (!$util.isInteger(message.uid))
                        return "uid: integer expected";
                if (message.registrationTime != null && message.hasOwnProperty("registrationTime"))
                    if (!$util.isInteger(message.registrationTime))
                        return "registrationTime: integer expected";
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    switch (message.orderType) {
                    default:
                        return "orderType: enum value expected";
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                    case 13:
                    case 14:
                        break;
                    }
                if (message.fulfilled != null && message.hasOwnProperty("fulfilled"))
                    if (typeof message.fulfilled !== "boolean")
                        return "fulfilled: boolean expected";
                return null;
            };

            /**
             * Creates an OrderUpdate message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {chefmoji.OrderUpdate} OrderUpdate
             */
            OrderUpdate.fromObject = function fromObject(object) {
                if (object instanceof $root.chefmoji.OrderUpdate)
                    return object;
                var message = new $root.chefmoji.OrderUpdate();
                if (object.uid != null)
                    message.uid = object.uid >>> 0;
                if (object.registrationTime != null)
                    message.registrationTime = object.registrationTime >>> 0;
                switch (object.orderType) {
                case "HOT_DOG":
                case 0:
                    message.orderType = 0;
                    break;
                case "PIZZA":
                case 1:
                    message.orderType = 1;
                    break;
                case "TACO":
                case 2:
                    message.orderType = 2;
                    break;
                case "GYRO":
                case 3:
                    message.orderType = 3;
                    break;
                case "SANDWICH":
                case 4:
                    message.orderType = 4;
                    break;
                case "HAMBURGER":
                case 5:
                    message.orderType = 5;
                    break;
                case "WAFFLES":
                case 6:
                    message.orderType = 6;
                    break;
                case "PANCAKES":
                case 7:
                    message.orderType = 7;
                    break;
                case "EGGS":
                case 8:
                    message.orderType = 8;
                    break;
                case "BURRITO":
                case 9:
                    message.orderType = 9;
                    break;
                case "SUSHI":
                case 10:
                    message.orderType = 10;
                    break;
                case "RAMEN":
                case 11:
                    message.orderType = 11;
                    break;
                case "BENTO_BOX":
                case 12:
                    message.orderType = 12;
                    break;
                case "STEW":
                case 13:
                    message.orderType = 13;
                    break;
                case "CURRY_RICE":
                case 14:
                    message.orderType = 14;
                    break;
                }
                if (object.fulfilled != null)
                    message.fulfilled = Boolean(object.fulfilled);
                return message;
            };

            /**
             * Creates a plain object from an OrderUpdate message. Also converts values to other types if specified.
             * @function toObject
             * @memberof chefmoji.OrderUpdate
             * @static
             * @param {chefmoji.OrderUpdate} message OrderUpdate
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            OrderUpdate.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.uid = 0;
                    object.registrationTime = 0;
                    object.orderType = options.enums === String ? "HOT_DOG" : 0;
                    object.fulfilled = false;
                }
                if (message.uid != null && message.hasOwnProperty("uid"))
                    object.uid = message.uid;
                if (message.registrationTime != null && message.hasOwnProperty("registrationTime"))
                    object.registrationTime = message.registrationTime;
                if (message.orderType != null && message.hasOwnProperty("orderType"))
                    object.orderType = options.enums === String ? $root.chefmoji.OrderType[message.orderType] : message.orderType;
                if (message.fulfilled != null && message.hasOwnProperty("fulfilled"))
                    object.fulfilled = message.fulfilled;
                return object;
            };

            /**
             * Converts this OrderUpdate to JSON.
             * @function toJSON
             * @memberof chefmoji.OrderUpdate
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            OrderUpdate.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, minimal$1.util.toJSONOptions);
            };

            return OrderUpdate;
        })();

        chefmoji.PlayerAction = (function() {

            /**
             * Properties of a PlayerAction.
             * @memberof chefmoji
             * @interface IPlayerAction
             * @property {string|null} [keyPress] PlayerAction keyPress
             */

            /**
             * Constructs a new PlayerAction.
             * @memberof chefmoji
             * @classdesc Represents a PlayerAction.
             * @implements IPlayerAction
             * @constructor
             * @param {chefmoji.IPlayerAction=} [properties] Properties to set
             */
            function PlayerAction(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * PlayerAction keyPress.
             * @member {string} keyPress
             * @memberof chefmoji.PlayerAction
             * @instance
             */
            PlayerAction.prototype.keyPress = "";

            /**
             * Creates a new PlayerAction instance using the specified properties.
             * @function create
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {chefmoji.IPlayerAction=} [properties] Properties to set
             * @returns {chefmoji.PlayerAction} PlayerAction instance
             */
            PlayerAction.create = function create(properties) {
                return new PlayerAction(properties);
            };

            /**
             * Encodes the specified PlayerAction message. Does not implicitly {@link chefmoji.PlayerAction.verify|verify} messages.
             * @function encode
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {chefmoji.IPlayerAction} message PlayerAction message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlayerAction.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                if (message.keyPress != null && message.hasOwnProperty("keyPress"))
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.keyPress);
                return writer;
            };

            /**
             * Encodes the specified PlayerAction message, length delimited. Does not implicitly {@link chefmoji.PlayerAction.verify|verify} messages.
             * @function encodeDelimited
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {chefmoji.IPlayerAction} message PlayerAction message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            PlayerAction.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes a PlayerAction message from the specified reader or buffer.
             * @function decode
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {chefmoji.PlayerAction} PlayerAction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlayerAction.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.chefmoji.PlayerAction();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.keyPress = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                return message;
            };

            /**
             * Decodes a PlayerAction message from the specified reader or buffer, length delimited.
             * @function decodeDelimited
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {chefmoji.PlayerAction} PlayerAction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            PlayerAction.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = new $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies a PlayerAction message.
             * @function verify
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {string|null} `null` if valid, otherwise the reason why it is not
             */
            PlayerAction.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (message.keyPress != null && message.hasOwnProperty("keyPress"))
                    if (!$util.isString(message.keyPress))
                        return "keyPress: string expected";
                return null;
            };

            /**
             * Creates a PlayerAction message from a plain object. Also converts values to their respective internal types.
             * @function fromObject
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {Object.<string,*>} object Plain object
             * @returns {chefmoji.PlayerAction} PlayerAction
             */
            PlayerAction.fromObject = function fromObject(object) {
                if (object instanceof $root.chefmoji.PlayerAction)
                    return object;
                var message = new $root.chefmoji.PlayerAction();
                if (object.keyPress != null)
                    message.keyPress = String(object.keyPress);
                return message;
            };

            /**
             * Creates a plain object from a PlayerAction message. Also converts values to other types if specified.
             * @function toObject
             * @memberof chefmoji.PlayerAction
             * @static
             * @param {chefmoji.PlayerAction} message PlayerAction
             * @param {$protobuf.IConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            PlayerAction.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults)
                    object.keyPress = "";
                if (message.keyPress != null && message.hasOwnProperty("keyPress"))
                    object.keyPress = message.keyPress;
                return object;
            };

            /**
             * Converts this PlayerAction to JSON.
             * @function toJSON
             * @memberof chefmoji.PlayerAction
             * @instance
             * @returns {Object.<string,*>} JSON object
             */
            PlayerAction.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, minimal$1.util.toJSONOptions);
            };

            return PlayerAction;
        })();

        return chefmoji;
    })();
    const MapUpdate = $root.chefmoji.MapUpdate;
    const OrderType = $root.chefmoji.OrderType;
    const PlayerUpdate = $root.chefmoji.PlayerUpdate;
    const OrderUpdate = $root.chefmoji.OrderUpdate;
    const MapRow = $root.chefmoji.MapRow;
    const PlayerAction = $root.chefmoji.PlayerAction;
    var messages = {
        default: $root.chefmoji,
        MapUpdate,
        OrderType,
        PlayerUpdate,
        OrderUpdate,
        MapRow,
        PlayerAction
    };
    var messages_1 = messages.MapUpdate;
    var messages_6 = messages.PlayerAction;

    /* src/App.svelte generated by Svelte v3.18.0 */
    const file$1 = "src/App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (228:5) {#each map_row.row as cell}
    function create_each_block_2(ctx) {
    	let td;
    	let t_value = /*cell*/ ctx[12].slice(1) + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			set_style(td, "background-color", cellToColor(/*cell*/ ctx[12].charAt(0)));
    			attr_dev(td, "class", "svelte-11ervpo");
    			add_location(td, file$1, 228, 6, 4023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*map*/ 1 && t_value !== (t_value = /*cell*/ ctx[12].slice(1) + "")) set_data_dev(t, t_value);

    			if (dirty & /*map*/ 1) {
    				set_style(td, "background-color", cellToColor(/*cell*/ ctx[12].charAt(0)));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(228:5) {#each map_row.row as cell}",
    		ctx
    	});

    	return block;
    }

    // (226:3) {#each map as map_row}
    function create_each_block_1(ctx) {
    	let tr;
    	let t;
    	let each_value_2 = /*map_row*/ ctx[9].row;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(tr, "class", "svelte-11ervpo");
    			add_location(tr, file$1, 226, 4, 3979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cellToColor, map*/ 1) {
    				each_value_2 = /*map_row*/ ctx[9].row;
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(226:3) {#each map as map_row}",
    		ctx
    	});

    	return block;
    }

    // (240:2) {#each orders as order}
    function create_each_block$1(ctx) {
    	let current;

    	const order = new Order({
    			props: {
    				order: /*recipes*/ ctx[1][/*order*/ ctx[6]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(order.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(order, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(order.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(order.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(order, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(240:2) {#each orders as order}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let div2;
    	let div0;
    	let table;
    	let t1;
    	let div1;
    	let h1;
    	let t3;
    	let current;
    	let dispose;
    	let each_value_1 = /*map*/ ctx[0];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*orders*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			table = element("table");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Orders";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(link, "href", "https://fonts.googleapis.com/css?family=Indie+Flower&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "class", "svelte-11ervpo");
    			add_location(link, file$1, 218, 1, 3784);
    			attr_dev(table, "class", "svelte-11ervpo");
    			add_location(table, file$1, 224, 2, 3941);
    			attr_dev(div0, "class", "map svelte-11ervpo");
    			add_location(div0, file$1, 223, 1, 3921);
    			attr_dev(h1, "class", "svelte-11ervpo");
    			add_location(h1, file$1, 238, 2, 4198);
    			attr_dev(div1, "class", "orders svelte-11ervpo");
    			add_location(div1, file$1, 237, 1, 4175);
    			attr_dev(div2, "class", "content svelte-11ervpo");
    			add_location(div2, file$1, 222, 0, 3898);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, table);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(table, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    			dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*map, cellToColor*/ 1) {
    				each_value_1 = /*map*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*recipes, orders*/ 6) {
    				each_value = /*orders*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const TEST_GAME_SESSION = "1aLc90";
    const WALL = "#000";
    const TABLE = "#ecb476";
    const FLOOR = "#fff";
    const FRIDGE = "#75c3d1";

    function validKey(key) {
    	return ["w", "a", "s", "d", "e", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"].includes(key);
    }

    function cellToColor(cell) {
    	switch (cell) {
    		case "W":
    			return WALL;
    		case "F":
    			return FRIDGE;
    		case "T":
    			return TABLE;
    		case "G":
    			return FLOOR;
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	console.log(messages);
    	const socket = socket_io("http://localhost:5000");

    	socket.on("connect", () => {
    		console.log(socket.id);
    	});

    	socket.on("accepting-connections", () => {
    		console.log("Server has notified me that it's accepting connections. Time to join the game!");
    		socket.emit("join-req", new Map([["id", TEST_GAME_SESSION]]));
    	});

    	let map = [];

    	socket.on("tick", data => {
    		if (data) {
    			let bytes = new Uint8Array(data);
    			let decoded = messages_1.decode(bytes);
    			$$invalidate(0, map = decoded.map);
    		}
    	});

    	const recipes = {
    		"🌭": {
    			name: "Hot Dog",
    			emoji: "🌭",
    			difficulty: 1,
    			ingredients: [{ emoji: "🍞", chopped: false }, { emoji: "🥩", chopped: false }],
    			cooked: true
    		},
    		"🍕": {
    			name: "Pizza",
    			emoji: "🍕",
    			difficulty: 1,
    			ingredients: [
    				{ emoji: "🍞", chopped: false },
    				{ emoji: "🧀", chopped: false },
    				{ emoji: "🍅", chopped: false }
    			],
    			cooked: true
    		},
    		"🧇": {
    			name: "Waffles",
    			emoji: "🧇",
    			difficulty: 1,
    			ingredients: [
    				{ emoji: "🥛", chopped: false },
    				{ emoji: "🥚", chopped: false },
    				{ emoji: "🌾", chopped: false }
    			],
    			cooked: true
    		},
    		"🍔": {
    			name: "Hamburger",
    			emoji: "🍔",
    			difficulty: 3,
    			ingredients: [
    				{ emoji: "🍞", chopped: false },
    				{ emoji: "🧀", chopped: false },
    				{ emoji: "🥩", chopped: false },
    				{ emoji: "🥬", chopped: true },
    				{ emoji: "🍅", chopped: true },
    				{ emoji: "🧅", chopped: true }
    			],
    			cooked: true
    		}
    	};

    	let orders = ["🍔", "🧇"];

    	function handleKeydown(event) {
    		let key = event.key;
    		let game_id = TEST_GAME_SESSION;

    		// Purely to prevent well meaning actors to unnecessarily send key events across the connection
    		if (validKey(key)) {
    			console.log(key);
    			let keyPressMsg = messages_6.create({ keyPress: key });
    			console.log(keyPressMsg);
    			let bytes = messages_6.encode(keyPressMsg).finish();
    			console.log(bytes);
    			socket.emit("keypress", bytes, game_id);
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("map" in $$props) $$invalidate(0, map = $$props.map);
    		if ("orders" in $$props) $$invalidate(2, orders = $$props.orders);
    	};

    	return [map, recipes, orders, handleKeydown];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
