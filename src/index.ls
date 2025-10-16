module.exports =
  pkg:
    name: 'treemap', version: '0.0.1'
    extend: {name: "@makechart/base"}
    dependencies: []
    i18n:
      "zh-TW":
        "other": "其它"
        "unit": "單位"
  init: ({root, context, pubsub, t}) ->
    pubsub.fire \init, mod: mod {root, context, t}

mod = ({root, context, t}) ->
  {chart,d3,ldcolor,wrap-svg-text} = context
  sample: ->
    raw: [0 to 50].map (val) ~>
      val: (Math.random!)toFixed(2)
      cat1: Math.floor(1 + 5 * Math.random!)
      cat2: <[- A B C D E F G]>[Math.floor(1 + 4 * Math.random!)]
      cat3: <[- a b c d e f g]>[Math.floor(1 + 3 * Math.random!)]
      name: <[A B C D E F]>[Math.floor(Math.random! * 6)] + "-" + Math.ceil(Math.random! * 10)
    binding:
      color: {key: \cat}
      area: {key: \val, unit: 'MB'}
      name: {key: \name}
      category: [{key: \cat1}, {key: \cat2}, {key: \cat3}]
      #category: {key: \cat1}
  config: chart.utils.config.from({
    preset: \default
    legend: \legend
    label: \label
  }) <<< do
    unit: position: type: \choice, values: <[inner outside none]>
    zoom:
      enabled: type: \boolean, default: false
  dimension:
    color: {type: \RC, name: "顏色", priority: 4}
    area: {type: \R, name: "面積", priority: 1}
    name: {type: \NC, name: "名稱", priority: 2}
    category: {type: \C, name: "分類", priority: 3, multiple: true}
  init: ->
    @tint = tint = new chart.utils.tint!
    @g = Object.fromEntries <[view unit legend]>.map ~> [it, d3.select(@layout.get-group it)]
    @text-renderer = text-renderer = document.createElement \div
    text-renderer.style <<< do
      textAlign: \right
      fontSize: \0.9em
      padding: ".5em .5em"
      line-height: \1.1em
      white-space: "pre-line"
      display: 'inline-block'
      position: \absolute
      top: 0
      left: 0
      opacity: 0
      pointer-events: \none
      user-select: \none
      zIndex: 0
    root.appendChild text-renderer
    @legend = new chart.utils.legend do
      layout: @layout
      name: \legend
      root: @root
      shape: (d) -> d3.select(@).attr \fill, tint.get d.key
      direction: if @cfg.{}legend.position == \bottom => \horizontal else \vertical
      cfg: selectable: true
    @legend.on \select, ~> @bind!; @resize!; @render!
    @tip = new chart.utils.tip {
      root: @root
      accessor: ({evt}) ~>
        if !(evt.target and data = d3.select(evt.target).datum!) => return null
        v = if isNaN(data.data.area) => '-' else "#{@fmt data.data.area}#{@binding.area.unit or ''}"
        return {name: data.data.name, value: v}
      range: ~> @layout.get-node \view .getBoundingClientRect!
    }

  destroy: -> @tip.destroy!

  parse: ->
    @tint.reset!
    @cat = cat =
      size: 0
      hash: {root: {id: "root"}}
      depth: (
        if Array.isArray(@binding.category) => ((@binding.category or []).length or 0)
        else if @binding.category => 1
        else 0
      )

    @parsed = @data.map (d, i) ~>
      d = {} <<< d <<< id: "id:#i"
      for j from d.[]category.length - 1 to 0 by -1 => if (d.category[j]? and d.category[j] != '') => break
      if j != d.category.length - 1 => d.category.splice(0, j + 1)
      #if cat.depth == 0 => d.category = [t "other"]
      obj = cat.hash.root
      d.catobj = []
      variant = 0
      len = (d.category or []).length
      for v in (d.category or []) =>
        parent = obj
        obj = obj.{}child{}["cat:#v"]
        if !obj.id? => obj <<< id: "cat:#{cat.size++}", name: v
        # for slightly variant of color to distinguish subcat
        v = if variant >= len/2 => variant - len else variant
        obj.variant = v / (5 * ((d.category or []).length + 1))
        # enable color variant: buggy, disabled for now.
        # variant++
        obj.parent = parent.id
        d.catobj.push obj
      # if node entry is provided - we use value to determine
      # if !(d.value?) or isNaN(d.value?) => obj.node = d
      d.parent = obj.id
      d
    traverse = (obj, catobj = []) ~>
      for k,v of (obj.child or {}) => traverse v, (catobj ++ [obj])
      @parsed.push(obj <<< {_cat: true, catobj: Array.from(catobj)})
    traverse cat.hash.root, []
    cat.nodes = if cat.depth == 0 => [] else @parsed.filter(->it._cat)
    cat.active = \root

  bind: ->
    data = @parsed
    s = d3.stratify!id(->it.id)parentId(->it.parent)
    @hierarchy = s(data)
    @hierarchy = @hierarchy.descendants!find((d) ~> d.id == @cat.active)

    @cat.cur-depth = @hierarchy.depth or 0
    # render subtree will require depth to be patched correctly.
    _ = (n, d = 0) ->
      n.depth = d
      area = 0
      for c in (n.children or []) => area += _(c, d + 1)
    _ @hierarchy
    nodes-for-legend = @cat.nodes
      .filter ~> it.parent == @cat.active and it.name
      .map -> key: it.id, text: it.name
    nodes-for-legend.sort (a,b) ->
      if a.text < b.text => -1 else if a.text > b.text => 1 else 0
    @legend.data nodes-for-legend
    if nodes-for-legend.length =>
      @hierarchy.children = @hierarchy.children.filter ~> @legend.is-selected it.data.id

  resize: ->
    @fmt = chart.utils.format.from @cfg.label.format
    @root.querySelector('.pdl-layout').classList.toggle \legend-bottom, @cfg.{}legend.position == \bottom
    @tip.toggle(if @cfg.{}tip.enabled? => @cfg.tip.enabled else true)
    @unit =
      inner: if @cfg.{}unit.position == \inner => (@binding.area.unit or '') else ''
      outer: (
        if @cfg.{}unit.position in <[inner none]> => ''
        else if @binding.area.unit => "#{t('unit')}: #{@binding.area.unit or ''}" else ''
      )
    @layout.get-node \unit
      ..style.display = if !@unit.outer => 'none' else ''
      ..textContent = @unit.outer
    @legend.config @cfg.legend
    @legend.update!
    @layout.update false
    @hierarchy.sum -> it.area or 0
    box = @layout.get-box \view
    if !(@hierarchy.children or []).length => delete @hierarchy.children
    @hierarchy.[]children.push {data: {}}
    tree = d3.treemap!
      .padding (n) ~> if n.depth >= (@cat.depth - @cat.cur-depth) => 1 else 0
      .size([box.width, box.height])
      .tile(d3.treemapBinary) @hierarchy
    @nodes = @hierarchy.leaves!filter -> it.data._raw
    @nodes.map -> it._raw = it.data._raw
    @extent = d3.extent @nodes.map -> it.value
  render: ->
    {cfg, unit, binding, layout, text-renderer, tint, fmt} = @
    tint.set cfg.palette
    #else tint.set @cats.map (d,i) ~> ldcolor.web(d3.interpolateTurbo(i/((@cats.length - 1) or 1)))

    get-fill = ~>
      #v = (((it.value - @extent.0) / (@extent.1 - @extent.0) ) - 0.5)
      ret = if it.data.color? => [it.data.color]
      else [(it.data.catobj[@cat.cur-depth] or {}).id, 0]
      # enable color variant
      # else [(it.data.catobj[0] or {}).id, (it.data.catobj[@cat.cur-depth + 1] or {}).variant]
      ret

    @g.unit.call ~>
      node = layout.get-node \unit
      ret = wrap-svg-text {node, useRange: true}
      @g.unit.node!textContent = ''
      @g.unit.node!appendChild ret
    sel = @g.view.selectAll \rect.data .data(@nodes, -> it.data._idx)
    sel.exit!
      .attr \class, 'data exit'
      .transition(\remove-rect).duration 275
      .attr \x, (d,i) -> (d.x0 + d.x1)/2
      .attr \y, (d,i) -> (d.y0 + d.y1)/2
      .attr \width, 0
      .attr \height, 0
      .attr \opacity, 0
      .remove!

    ctx = @
    sel.enter!append \rect
      .attr \class, 'data enter'
      .attr \x, -> (it.x1 + it.x0)/2
      .attr \y, -> (it.y1 + it.y0)/2
      .attr \width, -> 0
      .attr \height, -> 0
      .attr \fill, ~> tint.get.apply tint, get-fill(it)
      .style \opacity, 0
      .on \dblclick, (evt) ->
        if !(cfg.zoom or {}).enabled => return
        if ctx.zoomhdr => clearTimeout ctx.zoomhdr
        ctx.cat.active = \root
        ctx.bind!
        ctx.resize!
        ctx.render!
      .on \click, (evt) ->
        if !(cfg.zoom or {}).enabled => return
        if ctx.zoomhdr => clearTimeout ctx.zoomhdr
        ctx.zoomhdr = setTimeout (~>
          d = d3.select(@).datum!
          if !(catobj = d.data.catobj[ctx.cat.cur-depth]) => return
          ctx.cat.active = catobj.id
          ctx.bind!
          ctx.resize!
          ctx.render!
        ), 350
        evt.stopPropagation!

    sel.interrupt \remove-rect .attr \class, "data enter"
    @g.view.selectAll \rect.data.enter
      .transition(\update-rect).duration 350
      .attr \x, -> it.x0
      .attr \y, -> it.y0
      .attr \width, -> it.x1 - it.x0
      .attr \height, -> it.y1 - it.y0
      .attr \fill, ~> tint.get.apply tint, get-fill(it)
      .style \opacity, 1

    sel = @g.view.selectAll \g.label .data(@nodes, -> it.data._idx)
      ..exit!
        .attr \class, 'label data exit'
        .transition(\remove-label)duration 275
        .style \opacity, 0
        .remove!
      ..enter!append \g
        .attr \class, 'label data enter'
        .attr \transform, (d,i) -> "translate(#{d.x0},#{d.y0})"
        .style \opacity, 0
        .style \pointer-events, \none
        .style \cursor, \pointer
        .style \font-size, (cfg.font.size or \0.9em)

    sel.interrupt \remove-label .attr \class, "label data enter"
    @g.view.selectAll \g.label.data.enter
      .each (d,i) ->
        text-renderer.style.width = "#{d.x1 - d.x0}px"
        text-renderer.style.fontSize = cfg.font.size or \0.9em

        area = if isNaN(d.data.area) => '-' else fmt d.data.area
        text-renderer.innerHTML = """
        <div>#{d.data.name or ''}</div>
        <div>#{area}#{unit.inner}</div>
        """
        ret = wrap-svg-text node: text-renderer, useRange: true
        @textContent = ''
        @appendChild ret
      .attr \transform, (d,i) ->
        # text contains offset from width change which can't easily be applied with transition
        # thus we calculate the difference of width and cancel it directly in translate
        dx = (@ox or 0) + ((@ow or 0) - (d.x1 - d.x0))
        "translate(#{dx}, #{@oy or 0})"
      .transition(\label-update).duration 350
      .attr \transform, (d,i) ->
        "translate(#{d.x0},#{d.y0})"
      .attr \fill, ~> tint.text.apply tint, get-fill(it)
      .style \opacity, (d,i) ->
        box = @getBBox!
        return if box.width > (d.x1 - d.x0) - 5 or box.height > (d.y1 - d.y0 - 5) => 0 else 1
      .each (d,i) -> @ <<< ox: d.x0, oy: d.y0, ow: d.x1 - d.x0

    @legend.render!
