# treemap 的 test case ( @makechart/viewer 的 mctest )
# 每份資料用自己的種子, 跟產生的先後順序無關
mk = (n, lv = 2, seed = n) ->
  rnd = mctest.random seed
  raw: [0 til n].map (i) ->
    name: "N#i", val: Math.round(rnd! * 1000) / 10
    c1: "A#{Math.floor(rnd! * 4)}", c2: "B#{Math.floor(rnd! * 3)}", c3: "C#{Math.floor(rnd! * 2)}"
  binding:
    area: {key: \val, unit: \MB}
    name: {key: \name}
    category: [{key: \c1}, {key: \c2}, {key: \c3}].slice(0, lv)
flat = (n, seed = n) ->
  rnd = mctest.random seed
  raw: [0 til n].map (i) -> {name: "Item #i", val: Math.round(rnd! * 100)}
  binding: {area: {key: \val}, name: {key: \name}}
click = (sel, idx = 0) -> (c, ctx) ->
  ctx.root.querySelectorAll(sel)[idx].dispatchEvent new MouseEvent(\click, {bubbles: true})
# legend.select 不發事件, 照 treemap 的 legend select handler 重畫
pick = (keys) -> (c) ->
  c.legend.select keys
  c.bind!; c.resize!; c.render!

mctest.suite do
  size: [560, 400]
  data:
    flat: flat 12
    lv1: mk 24, 1
    lv2: mk 30, 2
    lv3: mk 40, 3
  cases:
    * name: "flat", data: \flat
    * name: "lv1", data: \lv1
    * name: "lv2", data: \lv2
    * name: "lv3", data: \lv3
    * name: "unit:inner", data: \lv1, config: {unit: {position: \inner}}
    * name: "unit:none", data: \lv1, config: {unit: {position: \none}}
    * name: "legend:bottom", data: \lv1, config: {legend: {position: \bottom}}
    * name: "font", data: \lv1, config: {font: {size: \14px}}
    * name: "small", data: \lv2, size: [300, 200]
    * name: "legend:pick", data: \lv1
      steps: (c) -> pick(c.legend._data.slice(0, 2).map -> it.key) c
    * name: "update", data: \lv1, steps: (c) -> d = mk 18, 1, 5; c.set-raw d.raw, d.binding
    # 點一格放大到它的分類, 雙擊回到最上層 ( click 有 350ms 延遲 )
    * name: "zoom", data: \lv2, config: {zoom: {enabled: true}}
      steps: [(click 'rect.data', 3), ((c, ctx) -> ctx.wait 450)]
    * name: "zoom-out", data: \lv2, config: {zoom: {enabled: true}}
      steps:
        * click 'rect.data', 3
        * (c, ctx) -> ctx.wait 450
        * (c, ctx) -> ctx.root.querySelector('rect.data').dispatchEvent new MouseEvent(\dblclick, {bubbles: true})

# lite 版才有: anim 的 manual 時鐘拍動畫中間格
mctest.suite do
  size: [560, 400]
  data: {lv1: mk 24, 1}
  cases:
    * name: "anim:update-frames", data: \lv1
      steps: (c, ctx) ->
        d = mk 18, 1, 5
        c.set-raw d.raw, d.binding
        for i from 1 to 4
          c.anim.step 70
          ctx.capture "t#{i * 70}"
