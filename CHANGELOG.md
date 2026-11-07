# Change Logs

## v0.0.3

 - extend the lite base ( `@makechart/base` `lite/index.html`, no d3 ): needs `@makechart/base` >= 0.2.0
   and `@plotdb/chart` >= 3.7.0. scales / shapes / transitions use `chart.utils`, and transitions run on
   `chart.anim`, so animation can be recorded frame by frame ( `anim.manual` / `step` )
 - `d3-hierarchy` is loaded as a dependency for stratify / treemap
 - add test cases ( `test/index.ls`, run with `npm test` via `@makechart/viewer` )


## v0.0.2

 - fix bug: potential bug of accessing hierarchy.children which is undefined 
 - fix bug: skip resize if @hierarchy is not available


## v0.0.1

init release
