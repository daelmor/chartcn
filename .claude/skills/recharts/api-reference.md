# Recharts API Reference

Source: [recharts.org](https://recharts.org/en-US/api)

---

## Chart Containers

All containers share these props:
- `width`, `height`: number — chart dimensions
- `data`: Array<object> — source data
- `margin`: `{top, right, bottom, left}` (default: 5 each)
- `layout`: "horizontal" | "vertical"
- `syncId`: string — sync tooltips across charts
- `stackOffset`: "none" | "expand" | "positive" | "sign" | "silhouette" | "wiggle"
- `barCategoryGap`: number | string (default: "10%")
- `barGap`: number | string (default: 4)
- `barSize`, `maxBarSize`: number
- Events: onClick, onMouseEnter, onMouseLeave, onMouseMove

### LineChart
Children: Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ReferenceLine, ReferenceArea

### BarChart
Children: Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush

### AreaChart
Extra: `baseValue`: "dataMin" | "dataMax" | number
Children: Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend

### PieChart
Extra: `cx`, `cy` (default: "50%"), `innerRadius` (default: 0), `outerRadius` (default: "80%"), `startAngle` (default: 0), `endAngle` (default: 360)
Children: Pie, Tooltip, Legend, Cell

### RadarChart
Extra: `cx`, `cy` (default: "50%"), `innerRadius`, `outerRadius` (default: "80%"), `startAngle` (default: 90), `endAngle` (default: -270)
Children: Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend

### RadialBarChart
Extra: `cx`, `cy` (default: "50%"), `innerRadius`, `outerRadius`, `startAngle` (default: 0), `endAngle` (default: 360)
Children: RadialBar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend

---

## Axis Components

### XAxis
- `dataKey`: string | number | Function
- `type`: "category" (default) | "number"
- `orientation`: "bottom" (default) | "top"
- `domain`: array — e.g. [0, 'auto'], ['dataMin', 'dataMax']
- `scale`: "auto" | "linear" | "log" | "time" | "band" | "point"
- `height`: number (default: 30)
- `hide`: boolean (default: false)
- `reversed`: boolean (default: false)
- `padding`: {left, right} | "gap" | "no-gap"
- `allowDecimals`: boolean (default: true)
- `tick`: bool | object | element | Function (default: true)
- `tickCount`: number (default: 5)
- `tickSize`: number (default: 6)
- `tickLine`: bool | SVGProps (default: true)
- `tickFormatter`: Function
- `interval`: "preserveEnd" (default) | "preserveStart" | "preserveStartEnd" | "equidistantPreserveStart" | number
- `axisLine`: bool | SVGProps (default: true)
- `label`: string | object | element
- `angle`: number (default: 0) — tick rotation

### YAxis
Same as XAxis except:
- `type`: "number" (default)
- `orientation`: "left" (default) | "right"
- `width`: number | "auto" (default: 60)
- `padding`: {top, bottom}

### CartesianGrid
- `horizontal`, `vertical`: boolean (default: true)
- `strokeDasharray`: string — e.g. "3 3"
- `horizontalFill`, `verticalFill`: string[] — stripe colors
- `syncWithTicks`: boolean (default: false)

---

## Graphical Items

### Line
- `dataKey`: string (REQUIRED)
- `type`: "linear" (default) | "monotone" | "monotoneX" | "monotoneY" | "natural" | "basis" | "step" | "stepAfter" | "stepBefore"
- `stroke`: string (default: "#3182bd")
- `strokeWidth`: number (default: 1)
- `strokeDasharray`: string — e.g. "5 5"
- `dot`: bool | object | element | Function (default: true)
- `activeDot`: bool | object (default: true)
- `connectNulls`: boolean (default: false)
- `label`: bool | object | element
- `name`: string — tooltip/legend name
- `unit`: string — tooltip unit
- `hide`: boolean (default: false)
- `xAxisId`, `yAxisId`: string | number (default: 0)
- Animation: `isAnimationActive` (default: "auto"), `animationDuration` (default: 1500ms), `animationEasing` (default: "ease")

### Bar
- `dataKey`: string (REQUIRED)
- `fill`: string — bar fill color
- `stackId`: string — bars with same ID stack
- `barSize`: number
- `radius`: number | [topLeft, topRight, bottomRight, bottomLeft] — corner radius
- `minPointSize`: number (default: 0)
- `background`: bool | object — background bars
- `label`: bool | object | element
- `shape`: element | Function — custom bar shape
- `activeBar`: bool | object (default: false)
- `name`, `unit`: string
- `hide`: boolean (default: false)
- Animation: `animationDuration` (default: 400ms)

### Area
- `dataKey`: string (REQUIRED)
- `type`: same curve types as Line (default: "linear")
- `stroke`: string (default: "#3182bd")
- `fill`: string — area fill color
- `fillOpacity`: number
- `stackId`: string — areas with same ID stack
- `dot`: bool | object (default: false)
- `activeDot`: bool | object (default: true)
- `connectNulls`: boolean (default: false)
- `baseValue`: "dataMin" | "dataMax" | number
- `label`, `name`, `unit`, `hide`: same as Line
- Animation: `animationDuration` (default: 1500ms)

### Pie
- `data`: Array<object> (REQUIRED — passed directly to Pie, not parent chart)
- `dataKey`: string (default: "value")
- `nameKey`: string (default: "name")
- `cx`, `cy`: number | string (default: "50%")
- `innerRadius`: number | string (default: 0) — >0 = donut
- `outerRadius`: number | string (default: "80%")
- `startAngle`: number (default: 0)
- `endAngle`: number (default: 360)
- `paddingAngle`: number (default: 0) — gap between slices
- `cornerRadius`: number — rounded slice corners
- `label`: bool | object | Function (default: false)
- `labelLine`: bool | object (default: true)
- Children: `<Cell fill={color} />` for per-slice styling

### Radar
- `dataKey`: string (REQUIRED)
- `stroke`: string
- `fill`: string
- `fillOpacity`: number
- `dot`: bool | object (default: false)
- `activeDot`: bool | object (default: true)
- `label`: bool | object
- `connectNulls`: boolean
- `hide`: boolean (default: false)
- Animation: `animationDuration` (default: 1500ms)

### RadialBar
- `dataKey`: string (REQUIRED)
- `barSize`: number
- `cornerRadius`: number (default: 0)
- `background`: bool | object (default: false)
- `label`: bool | object
- `stackId`: string
- `hide`: boolean (default: false)
- Animation: `animationDuration` (default: 1500ms)

### Cell (deprecated — use shape prop on parent instead)
- `fill`: string
- `stroke`: string

---

## Polar Components

### PolarGrid
- `gridType`: "polygon" (default) | "circle"
- `radialLines`: boolean (default: true)

### PolarAngleAxis
- `dataKey`: string
- `type`: "category" (default) | "number"
- `orientation`: "outer" (default) | "inner"
- `axisLine`: bool | SVGProps (default: true)
- `axisLineType`: "polygon" (default) | "circle"
- `tick`: bool | object | element (default: true)
- `tickSize`: number (default: 8)
- `tickLine`: bool (default: true)
- `tickFormatter`: Function
- `hide`: boolean (default: false)

### PolarRadiusAxis
- `type`: "number" (default) | "category"
- `dataKey`: string
- `orientation`: "right" (default) | "left" | "middle"
- `angle`: number (default: 0) — axis rotation
- `tick`: bool | object (default: true)
- `tickCount`: number (default: 5)
- `tickFormatter`: Function
- `axisLine`: bool (default: true)
- `hide`: boolean (default: false)

---

## General Components

### Tooltip
- `trigger`: "hover" (default) | "click"
- `separator`: string (default: " : ")
- `offset`: number (default: 10)
- `cursor`: bool | SVGProps (default: true)
- `content`: element | Function — custom tooltip
- `formatter`: Function — format values
- `labelFormatter`: Function — format label
- `filterNull`: boolean (default: true)
- `wrapperStyle`, `contentStyle`, `itemStyle`, `labelStyle`: CSSProperties
- Animation: `animationDuration` (default: 400ms)

### Legend
- `layout`: "horizontal" (default) | "vertical"
- `align`: "center" (default) | "left" | "right"
- `verticalAlign`: "bottom" (default) | "top" | "middle"
- `iconType`: "rect" | "circle" | "cross" | "diamond" | "line" | "plainline" | "square" | "star" | "triangle" | "wye" | "none"
- `iconSize`: number (default: 14)
- `content`: element | Function — custom legend
- `formatter`: Function — customize text
- `wrapperStyle`: CSSProperties
- Events: onClick, onMouseEnter, onMouseLeave

---

## Key Notes

1. **Curve types**: "linear", "monotone", "monotoneX", "monotoneY", "natural", "basis", "step", "stepAfter", "stepBefore"
2. **Domain shortcuts**: `['auto', 'auto']`, `['dataMin', 'dataMax']`, `[0, 100]`, or functions `[d => d * 0.9, d => d * 1.1]`
3. **Stacking**: Set same `stackId` on multiple Bar/Area components. Use `stackOffset="expand"` for 100% stacked.
4. **Horizontal bars**: Set `layout="vertical"` on BarChart, use YAxis as category axis, XAxis as value axis.
5. **Donut chart**: Set `innerRadius` > 0 on Pie.
6. **Sync charts**: Same `syncId` syncs Tooltip and Brush across charts.
7. **Animation in SSR**: `isAnimationActive="auto"` disables animations in non-browser environments.
8. **Cell is deprecated**: Migrate to `shape` prop on parent (Pie, RadialBar) in Recharts 4.0.
