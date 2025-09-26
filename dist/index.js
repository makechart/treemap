(function(){
  var mod;
  module.exports = {
    pkg: {
      name: 'treemap',
      version: '0.0.1',
      extend: {
        name: "base",
        version: "0.0.1"
      },
      dependencies: [],
      i18n: {
        "zh-TW": {
          "other": "其它",
          "unit": "單位"
        }
      }
    },
    init: function(arg$){
      var root, context, pubsub, t;
      root = arg$.root, context = arg$.context, pubsub = arg$.pubsub, t = arg$.t;
      return pubsub.fire('init', {
        mod: mod({
          root: root,
          context: context,
          t: t
        })
      });
    }
  };
  mod = function(arg$){
    var root, context, t, chart, d3, ldcolor, wrapSvgText;
    root = arg$.root, context = arg$.context, t = arg$.t;
    chart = context.chart, d3 = context.d3, ldcolor = context.ldcolor, wrapSvgText = context.wrapSvgText;
    return {
      sample: function(){
        return {
          raw: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50].map(function(val){
            return {
              val: Math.random().toFixed(2),
              cat1: Math.floor(1 + 5 * Math.random()),
              cat2: ['-', 'A', 'B', 'C', 'D', 'E', 'F', 'G'][Math.floor(1 + 4 * Math.random())],
              cat3: ['-', 'a', 'b', 'c', 'd', 'e', 'f', 'g'][Math.floor(1 + 3 * Math.random())],
              name: ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)] + "-" + Math.ceil(Math.random() * 10)
            };
          }),
          binding: {
            color: {
              key: 'cat'
            },
            area: {
              key: 'val',
              unit: 'MB'
            },
            name: {
              key: 'name'
            },
            category: [
              {
                key: 'cat1'
              }, {
                key: 'cat2'
              }, {
                key: 'cat3'
              }
            ]
          }
        };
      },
      config: import$(chart.utils.config.from({
        preset: 'default',
        legend: 'legend',
        label: 'label'
      }), {
        unit: {
          position: {
            type: 'choice',
            values: ['inner', 'outside', 'none']
          }
        },
        zoom: {
          enabled: {
            type: 'boolean',
            'default': false
          }
        }
      }),
      dimension: {
        color: {
          type: 'RC',
          name: "顏色",
          priority: 4
        },
        area: {
          type: 'R',
          name: "面積",
          priority: 1
        },
        name: {
          type: 'NC',
          name: "名稱",
          priority: 2
        },
        category: {
          type: 'C',
          name: "分類",
          priority: 3,
          multiple: true
        }
      },
      init: function(){
        var tint, textRenderer, ref$, this$ = this;
        this.tint = tint = new chart.utils.tint();
        this.g = Object.fromEntries(['view', 'unit', 'legend'].map(function(it){
          return [it, d3.select(this$.layout.getGroup(it))];
        }));
        this.textRenderer = textRenderer = document.createElement('div');
        import$(textRenderer.style, {
          textAlign: 'right',
          fontSize: '0.9em',
          padding: ".5em .5em",
          lineHeight: '1.1em',
          whiteSpace: "pre-line",
          display: 'inline-block',
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0
        });
        root.appendChild(textRenderer);
        this.legend = new chart.utils.legend({
          layout: this.layout,
          name: 'legend',
          root: this.root,
          shape: function(d){
            return d3.select(this).attr('fill', tint.get(d.key));
          },
          direction: ((ref$ = this.cfg).legend || (ref$.legend = {})).position === 'bottom' ? 'horizontal' : 'vertical',
          cfg: {
            selectable: true
          }
        });
        this.legend.on('select', function(){
          this$.bind();
          this$.resize();
          return this$.render();
        });
        return this.tip = new chart.utils.tip({
          root: this.root,
          accessor: function(arg$){
            var evt, data, v;
            evt = arg$.evt;
            if (!(evt.target && (data = d3.select(evt.target).datum()))) {
              return null;
            }
            v = isNaN(data.data.area)
              ? '-'
              : this$.fmt(data.data.area) + "" + (this$.binding.area.unit || '');
            return {
              name: data.data.name,
              value: v
            };
          },
          range: function(){
            return this$.layout.getNode('view').getBoundingClientRect();
          }
        });
      },
      destroy: function(){
        return this.tip.destroy();
      },
      parse: function(){
        var cat, traverse, this$ = this;
        this.tint.reset();
        this.cat = cat = {
          size: 0,
          hash: {
            root: {
              id: "root"
            }
          },
          depth: Array.isArray(this.binding.category)
            ? (this.binding.category || []).length || 0
            : this.binding.category ? 1 : 0
        };
        this.parsed = this.data.map(function(d, i){
          var ref$, i$, j, obj, variant, len, len$, v, parent, ref1$, key$;
          d = (ref$ = import$({}, d), ref$.id = "id:" + i, ref$);
          for (i$ = (d.category || (d.category = [])).length - 1; i$ >= 0; --i$) {
            j = i$;
            if (d.category[j] != null && d.category[j] !== '') {
              break;
            }
          }
          if (j !== d.category.length - 1) {
            d.category.splice(0, j + 1);
          }
          obj = cat.hash.root;
          d.catobj = [];
          variant = 0;
          len = (d.category || []).length;
          for (i$ = 0, len$ = (ref$ = d.category || []).length; i$ < len$; ++i$) {
            v = ref$[i$];
            parent = obj;
            obj = (ref1$ = obj.child || (obj.child = {}))[key$ = "cat:" + v] || (ref1$[key$] = {});
            if (obj.id == null) {
              obj.id = "cat:" + (cat.size++);
              obj.name = v;
            }
            v = variant >= len / 2 ? variant - len : variant;
            obj.variant = v / (5 * ((d.category || []).length + 1));
            obj.parent = parent.id;
            d.catobj.push(obj);
          }
          d.parent = obj.id;
          return d;
        });
        traverse = function(obj, catobj){
          var k, ref$, v;
          catobj == null && (catobj = []);
          for (k in ref$ = obj.child || {}) {
            v = ref$[k];
            traverse(v, catobj.concat([obj]));
          }
          return this$.parsed.push((obj._cat = true, obj.catobj = Array.from(catobj), obj));
        };
        traverse(cat.hash.root, []);
        cat.nodes = cat.depth === 0
          ? []
          : this.parsed.filter(function(it){
            return it._cat;
          });
        return cat.active = 'root';
      },
      bind: function(){
        var data, s, _, nodesForLegend, this$ = this;
        data = this.parsed;
        s = d3.stratify().id(function(it){
          return it.id;
        }).parentId(function(it){
          return it.parent;
        });
        this.hierarchy = s(data);
        this.hierarchy = this.hierarchy.descendants().find(function(d){
          return d.id === this$.cat.active;
        });
        this.cat.curDepth = this.hierarchy.depth || 0;
        _ = function(n, d){
          var area, i$, ref$, len$, c, results$ = [];
          d == null && (d = 0);
          n.depth = d;
          area = 0;
          for (i$ = 0, len$ = (ref$ = n.children || []).length; i$ < len$; ++i$) {
            c = ref$[i$];
            results$.push(area += _(c, d + 1));
          }
          return results$;
        };
        _(this.hierarchy);
        nodesForLegend = this.cat.nodes.filter(function(it){
          return it.parent === this$.cat.active && it.name;
        }).map(function(it){
          return {
            key: it.id,
            text: it.name
          };
        });
        nodesForLegend.sort(function(a, b){
          if (a.text < b.text) {
            return -1;
          } else if (a.text > b.text) {
            return 1;
          } else {
            return 0;
          }
        });
        this.legend.data(nodesForLegend);
        if (nodesForLegend.length) {
          return this.hierarchy.children = this.hierarchy.children.filter(function(it){
            return this$.legend.isSelected(it.data.id);
          });
        }
      },
      resize: function(){
        var ref$, ref1$, x$, box, tree, this$ = this;
        this.fmt = chart.utils.format.from(this.cfg.label.format);
        this.root.querySelector('.pdl-layout').classList.toggle('legend-bottom', ((ref$ = this.cfg).legend || (ref$.legend = {})).position === 'bottom');
        this.tip.toggle(((ref$ = this.cfg).tip || (ref$.tip = {})).enabled != null ? this.cfg.tip.enabled : true);
        this.unit = {
          inner: ((ref$ = this.cfg).unit || (ref$.unit = {})).position === 'inner' ? this.binding.area.unit || '' : '',
          outer: (ref$ = ((ref1$ = this.cfg).unit || (ref1$.unit = {})).position) === 'inner' || ref$ === 'none'
            ? ''
            : this.binding.area.unit ? t('unit') + ": " + (this.binding.area.unit || '') : ''
        };
        x$ = this.layout.getNode('unit');
        x$.style.display = !this.unit.outer ? 'none' : '';
        x$.textContent = this.unit.outer;
        this.legend.config(this.cfg.legend);
        this.legend.update();
        this.layout.update(false);
        this.hierarchy.sum(function(it){
          return it.area || 0;
        });
        box = this.layout.getBox('view');
        if (!this.hierarchy.children.length) {
          delete this.hierarchy.children;
        }
        this.hierarchy.children.push({
          data: {}
        });
        tree = d3.treemap().padding(function(n){
          if (n.depth >= this$.cat.depth - this$.cat.curDepth) {
            return 1;
          } else {
            return 0;
          }
        }).size([box.width, box.height]).tile(d3.treemapBinary)(this.hierarchy);
        this.nodes = this.hierarchy.leaves().filter(function(it){
          return it.data._raw;
        });
        this.nodes.map(function(it){
          return it._raw = it.data._raw;
        });
        return this.extent = d3.extent(this.nodes.map(function(it){
          return it.value;
        }));
      },
      render: function(){
        var cfg, unit, binding, layout, textRenderer, tint, fmt, getFill, sel, ctx, x$, this$ = this;
        cfg = this.cfg, unit = this.unit, binding = this.binding, layout = this.layout, textRenderer = this.textRenderer, tint = this.tint, fmt = this.fmt;
        tint.set(cfg.palette);
        getFill = function(it){
          var ret;
          ret = it.data.color != null
            ? [it.data.color]
            : [(it.data.catobj[this$.cat.curDepth] || {}).id, 0];
          return ret;
        };
        this.g.unit.call(function(){
          var node, ret;
          node = layout.getNode('unit');
          ret = wrapSvgText({
            node: node,
            useRange: true
          });
          this$.g.unit.node().textContent = '';
          return this$.g.unit.node().appendChild(ret);
        });
        sel = this.g.view.selectAll('rect.data').data(this.nodes, function(it){
          return it.data._idx;
        });
        sel.exit().attr('class', 'data exit').transition('remove-rect').duration(275).attr('x', function(d, i){
          return (d.x0 + d.x1) / 2;
        }).attr('y', function(d, i){
          return (d.y0 + d.y1) / 2;
        }).attr('width', 0).attr('height', 0).attr('opacity', 0).remove();
        ctx = this;
        sel.enter().append('rect').attr('class', 'data enter').attr('x', function(it){
          return (it.x1 + it.x0) / 2;
        }).attr('y', function(it){
          return (it.y1 + it.y0) / 2;
        }).attr('width', function(){
          return 0;
        }).attr('height', function(){
          return 0;
        }).attr('fill', function(it){
          return tint.get.apply(tint, getFill(it));
        }).style('opacity', 0).on('dblclick', function(evt){
          if (!(cfg.zoom || {}).enabled) {
            return;
          }
          if (ctx.zoomhdr) {
            clearTimeout(ctx.zoomhdr);
          }
          ctx.cat.active = 'root';
          ctx.bind();
          ctx.resize();
          return ctx.render();
        }).on('click', function(evt){
          var this$ = this;
          if (!(cfg.zoom || {}).enabled) {
            return;
          }
          if (ctx.zoomhdr) {
            clearTimeout(ctx.zoomhdr);
          }
          ctx.zoomhdr = setTimeout(function(){
            var d, catobj;
            d = d3.select(this$).datum();
            if (!(catobj = d.data.catobj[ctx.cat.curDepth])) {
              return;
            }
            ctx.cat.active = catobj.id;
            ctx.bind();
            ctx.resize();
            return ctx.render();
          }, 350);
          return evt.stopPropagation();
        });
        sel.interrupt('remove-rect').attr('class', "data enter");
        this.g.view.selectAll('rect.data.enter').transition('update-rect').duration(350).attr('x', function(it){
          return it.x0;
        }).attr('y', function(it){
          return it.y0;
        }).attr('width', function(it){
          return it.x1 - it.x0;
        }).attr('height', function(it){
          return it.y1 - it.y0;
        }).attr('fill', function(it){
          return tint.get.apply(tint, getFill(it));
        }).style('opacity', 1);
        x$ = sel = this.g.view.selectAll('g.label').data(this.nodes, function(it){
          return it.data._idx;
        });
        x$.exit().attr('class', 'label data exit').transition('remove-label').duration(275).style('opacity', 0).remove();
        x$.enter().append('g').attr('class', 'label data enter').attr('transform', function(d, i){
          return "translate(" + d.x0 + "," + d.y0 + ")";
        }).style('opacity', 0).style('pointer-events', 'none').style('cursor', 'pointer').style('font-size', cfg.font.size || '0.9em');
        sel.interrupt('remove-label').attr('class', "label data enter");
        this.g.view.selectAll('g.label.data.enter').each(function(d, i){
          var area, ret;
          textRenderer.style.width = (d.x1 - d.x0) + "px";
          textRenderer.style.fontSize = cfg.font.size || '0.9em';
          area = isNaN(d.data.area)
            ? '-'
            : fmt(d.data.area);
          textRenderer.innerHTML = "<div>" + (d.data.name || '') + "</div>\n<div>" + area + unit.inner + "</div>";
          ret = wrapSvgText({
            node: textRenderer,
            useRange: true
          });
          this.textContent = '';
          return this.appendChild(ret);
        }).attr('transform', function(d, i){
          var dx;
          dx = (this.ox || 0) + ((this.ow || 0) - (d.x1 - d.x0));
          return "translate(" + dx + ", " + (this.oy || 0) + ")";
        }).transition('label-update').duration(350).attr('transform', function(d, i){
          return "translate(" + d.x0 + "," + d.y0 + ")";
        }).attr('fill', function(it){
          return tint.text.apply(tint, getFill(it));
        }).style('opacity', function(d, i){
          var box;
          box = this.getBBox();
          return box.width > (d.x1 - d.x0) - 5 || box.height > d.y1 - d.y0 - 5 ? 0 : 1;
        }).each(function(d, i){
          return this.ox = d.x0, this.oy = d.y0, this.ow = d.x1 - d.x0, this;
        });
        return this.legend.render();
      }
    };
  };
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
