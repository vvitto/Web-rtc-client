
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function flush() {
        const seen_callbacks = new Set();
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
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
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

    /* src/Button.svelte generated by Svelte v3.8.0 */

    const file = "src/Button.svelte";

    function create_fragment(ctx) {
    	var button, t, dispose;

    	return {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.text);
    			attr(button, "class", "btn svelte-1yd0h9x");
    			button.disabled = ctx.disabled;
    			add_location(button, file, 14, 0, 190);
    			dispose = listen(button, "click", ctx.callback);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.text) {
    				set_data(t, ctx.text);
    			}

    			if (changed.disabled) {
    				button.disabled = ctx.disabled;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { callback, disabled, text } = $$props;

    	const writable_props = ['callback', 'disabled', 'text'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('callback' in $$props) $$invalidate('callback', callback = $$props.callback);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    	};

    	return { callback, disabled, text };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["callback", "disabled", "text"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.callback === undefined && !('callback' in props)) {
    			console.warn("<Button> was created without expected prop 'callback'");
    		}
    		if (ctx.disabled === undefined && !('disabled' in props)) {
    			console.warn("<Button> was created without expected prop 'disabled'");
    		}
    		if (ctx.text === undefined && !('text' in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}
    	}

    	get callback() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CallTab.svelte generated by Svelte v3.8.0 */

    const file$1 = "src/CallTab.svelte";

    // (10:4) <Button>
    function create_default_slot_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Register");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (14:4) <Button>
    function create_default_slot_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Unregister");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (22:4) <Button>
    function create_default_slot(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Call");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div3, t0, t1, div0, t3, input, t4, t5, div1, t7, div2, current;

    	var button0 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button1 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button2 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div3 = element("div");
    			button0.$$.fragment.c();
    			t0 = space();
    			button1.$$.fragment.c();
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Contact";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button2.$$.fragment.c();
    			t5 = space();
    			div1 = element("div");
    			div1.textContent = "0:33";
    			t7 = space();
    			div2 = element("div");
    			div2.textContent = "outgoing";
    			attr(div0, "class", "name");
    			add_location(div0, file$1, 17, 4, 187);
    			attr(input, "type", "text");
    			attr(input, "class", "number");
    			add_location(input, file$1, 19, 4, 224);
    			attr(div1, "class", "time");
    			add_location(div1, file$1, 23, 4, 292);
    			attr(div2, "class", "status");
    			add_location(div2, file$1, 25, 4, 326);
    			add_location(div3, file$1, 8, 0, 81);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			mount_component(button0, div3, null);
    			append(div3, t0);
    			mount_component(button1, div3, null);
    			append(div3, t1);
    			append(div3, div0);
    			append(div3, t3);
    			append(div3, input);
    			append(div3, t4);
    			mount_component(button2, div3, null);
    			append(div3, t5);
    			append(div3, div1);
    			append(div3, t7);
    			append(div3, div2);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button0_changes = {};
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);

    			var button2_changes = {};
    			if (changed.$$scope) button2_changes.$$scope = { changed, ctx };
    			button2.$set(button2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			transition_in(button2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			destroy_component(button0);

    			destroy_component(button1);

    			destroy_component(button2);
    		}
    	};
    }

    class CallTab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src/Field.svelte generated by Svelte v3.8.0 */

    const file$2 = "src/Field.svelte";

    function create_fragment$2(ctx) {
    	var div, label_1, t0, t1, input, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(ctx.label);
    			t1 = space();
    			input = element("input");
    			attr(label_1, "for", ctx.field);
    			add_location(label_1, file$2, 17, 4, 221);
    			attr(input, "type", "text");
    			attr(input, "class", "input svelte-11lji9b");
    			attr(input, "name", ctx.label);
    			add_location(input, file$2, 18, 4, 260);
    			attr(div, "class", "field svelte-11lji9b");
    			add_location(div, file$2, 16, 0, 197);
    			dispose = listen(input, "change", ctx.change_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, label_1);
    			append(label_1, t0);
    			append(div, t1);
    			append(div, input);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data(t0, ctx.label);
    			}

    			if (changed.field) {
    				attr(label_1, "for", ctx.field);
    			}

    			if (changed.label) {
    				attr(input, "name", ctx.label);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { label, field, type = 'text' } = $$props;

    	const writable_props = ['label', 'field', 'type'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Field> was created with unknown prop '${key}'`);
    	});

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('field' in $$props) $$invalidate('field', field = $$props.field);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    	};

    	return { label, field, type, change_handler };
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, ["label", "field", "type"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.label === undefined && !('label' in props)) {
    			console.warn("<Field> was created without expected prop 'label'");
    		}
    		if (ctx.field === undefined && !('field' in props)) {
    			console.warn("<Field> was created without expected prop 'field'");
    		}
    	}

    	get label() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get field() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set field(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ConfigTab.svelte generated by Svelte v3.8.0 */

    const file$3 = "src/ConfigTab.svelte";

    function create_fragment$3(ctx) {
    	var div, t0, t1, t2, t3, t4, current;

    	var field0 = new Field({
    		props: { label: "WS server", field: "ws_server" },
    		$$inline: true
    	});
    	field0.$on("change", hangeFieldOnСhange);

    	var field1 = new Field({
    		props: {
    		label: "Stun server",
    		field: "stun_server"
    	},
    		$$inline: true
    	});
    	field1.$on("change", hangeFieldOnСhange);

    	var field2 = new Field({
    		props: { label: "URI", field: "uri" },
    		$$inline: true
    	});
    	field2.$on("change", hangeFieldOnСhange);

    	var field3 = new Field({
    		props: { label: "Password", field: "password" },
    		$$inline: true
    	});
    	field3.$on("change", hangeFieldOnСhange);

    	var field4 = new Field({
    		props: { label: "Number", field: "number" },
    		$$inline: true
    	});
    	field4.$on("change", hangeFieldOnСhange);

    	var button = new Button({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			field0.$$.fragment.c();
    			t0 = space();
    			field1.$$.fragment.c();
    			t1 = space();
    			field2.$$.fragment.c();
    			t2 = space();
    			field3.$$.fragment.c();
    			t3 = space();
    			field4.$$.fragment.c();
    			t4 = space();
    			button.$$.fragment.c();
    			add_location(div, file$3, 9, 0, 166);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(field0, div, null);
    			append(div, t0);
    			mount_component(field1, div, null);
    			append(div, t1);
    			mount_component(field2, div, null);
    			append(div, t2);
    			mount_component(field3, div, null);
    			append(div, t3);
    			mount_component(field4, div, null);
    			append(div, t4);
    			mount_component(button, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);

    			transition_in(field1.$$.fragment, local);

    			transition_in(field2.$$.fragment, local);

    			transition_in(field3.$$.fragment, local);

    			transition_in(field4.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			transition_out(field2.$$.fragment, local);
    			transition_out(field3.$$.fragment, local);
    			transition_out(field4.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(field0);

    			destroy_component(field1);

    			destroy_component(field2);

    			destroy_component(field3);

    			destroy_component(field4);

    			destroy_component(button);
    		}
    	};
    }

    function hangeFieldOnСhange(field, value) {
        
    }

    class ConfigTab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src/LeftPanel.svelte generated by Svelte v3.8.0 */

    const file$4 = "src/LeftPanel.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.name = list[i].name;
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (69:8) {#each tabs as { name }
    function create_each_block(ctx) {
    	var div, t0_value = ctx.name + "", t0, t1, div_class_value, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(div, "class", div_class_value = "" + null_to_empty((`tab ${ctx.index === ctx.activeTab? 'active' : ''}`)) + " svelte-1egwbtf");
    			add_location(div, file$4, 69, 12, 1242);
    			dispose = listen(div, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.activeTab) && div_class_value !== (div_class_value = "" + null_to_empty((`tab ${ctx.index === ctx.activeTab? 'active' : ''}`)) + " svelte-1egwbtf")) {
    				attr(div, "class", div_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (82:33) 
    function create_if_block_1(ctx) {
    	var current;

    	var configtab = new ConfigTab({ $$inline: true });

    	return {
    		c: function create() {
    			configtab.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(configtab, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(configtab.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(configtab.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(configtab, detaching);
    		}
    	};
    }

    // (80:8) {#if activeTab == 0}
    function create_if_block(ctx) {
    	var current;

    	var calltab = new CallTab({ $$inline: true });

    	return {
    		c: function create() {
    			calltab.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(calltab, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(calltab.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(calltab.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(calltab, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var div2, div0, t, div1, current_block_type_index, if_block, current;

    	var each_value = ctx.tabs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	var if_block_creators = [
    		create_if_block,
    		create_if_block_1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.activeTab == 0) return 0;
    		if (ctx.activeTab == 1) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr(div0, "class", "tabs svelte-1egwbtf");
    			add_location(div0, file$4, 67, 4, 1171);
    			attr(div1, "class", "panel svelte-1egwbtf");
    			add_location(div1, file$4, 78, 4, 1457);
    			attr(div2, "class", "left-panel svelte-1egwbtf");
    			add_location(div2, file$4, 66, 0, 1142);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append(div2, t);
    			append(div2, div1);
    			if (~current_block_type_index) if_blocks[current_block_type_index].m(div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.activeTab || changed.tabs) {
    				each_value = ctx.tabs;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
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

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();
    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});
    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];
    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			destroy_each(each_blocks, detaching);

    			if (~current_block_type_index) if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

        let activeTab = 0;

        function setActiveTab(number) {
            $$invalidate('activeTab', activeTab = number);
        }

        let tabs = [{
            name: 'Call'
        }, {
            name: 'Config'
        }];

    	function click_handler({ index }) {
    		return setActiveTab(index);
    	}

    	$$self.$$.update = ($$dirty = { activeTab: 1 }) => {
    		if ($$dirty.activeTab) { { console.log(activeTab); } }
    	};

    	return {
    		activeTab,
    		setActiveTab,
    		tabs,
    		click_handler
    	};
    }

    class LeftPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, []);
    	}
    }

    /* src/Logger.svelte generated by Svelte v3.8.0 */

    function create_fragment$5(ctx) {
    	return {
    		c: noop,

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    class Logger extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.8.0 */

    const file$5 = "src/App.svelte";

    function create_fragment$6(ctx) {
    	var div, t, current;

    	var leftpanel = new LeftPanel({ $$inline: true });

    	var logger = new Logger({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			leftpanel.$$.fragment.c();
    			t = space();
    			logger.$$.fragment.c();
    			attr(div, "class", "app-wrapper svelte-183fcl1");
    			add_location(div, file$5, 12, 0, 173);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(leftpanel, div, null);
    			append(div, t);
    			mount_component(logger, div, null);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(leftpanel.$$.fragment, local);

    			transition_in(logger.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(leftpanel.$$.fragment, local);
    			transition_out(logger.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(leftpanel);

    			destroy_component(logger);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$6, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
