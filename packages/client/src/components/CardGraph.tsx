import { useMemo } from 'react'
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationNodeDatum,
} from 'd3-force'
import { UNGROUPED_COLOR } from '../lib/config'
import { categoryOf } from '../lib/chart'
import { useLang } from '../lib/i18n'
import type { CardSource, Schema } from '../lib/types'
import { Legend } from './analysis/Legend'

/**
 * One card as a simulation node; `x`/`y` are filled in by d3-force.
 *
 * @property {string} id Card id, shown as letter below the node.
 * @property {string} image Card image URL.
 * @property {string | null} color Category color in the selected schema, `null` = no category.
 */
interface GraphNode extends SimulationNodeDatum {
  id: string
  image: string
  color: string | null
}

/**
 * Link between two nodes.
 *
 * @property {GraphNode} source First card.
 * @property {GraphNode} target Second card.
 * @property {number} weight Number of submissions with both cards in one group.
 */
interface GraphLink {
  source: GraphNode
  target: GraphNode
  weight: number
}

/**
 * Card pair by matrix index (`i < j`) with its co-occurrence count.
 *
 * @property {number} i Index of the first card.
 * @property {number} j Index of the second card.
 * @property {number} weight Co-occurrence count.
 */
type Edge = { i: number; j: number; weight: number }

/** Node radius. */
const R = 26
/** Simulation iterations until the layout settles. */
const TICKS = 320
/**
 * Adaptive edge selection: an edge is shown if its weight is ≥ `EDGE_RATIO` × the node's
 * strongest edge (at least the strongest, at most `EDGE_MAX`), united over both ends.
 */
const EDGE_RATIO = 0.6
const EDGE_MAX = 5

/**
 * All card pairs that co-occur at least once.
 *
 * @param {number[][]} matrix Aggregate co-occurrence matrix.
 * @param {number} n Number of cards.
 * @returns {Edge[]} One edge per pair with weight > 0.
 */
function allEdges(matrix: number[][], n: number): Edge[] {
  const edges: Edge[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matrix[i][j] > 0) edges.push({ i, j, weight: matrix[i][j] })
    }
  }
  return edges
}

/**
 * Edges worth drawing, selected per node by {@link EDGE_RATIO} and {@link EDGE_MAX}.
 *
 * @param {number[][]} matrix Aggregate co-occurrence matrix.
 * @param {number} n Number of cards.
 * @returns {Edge[]} Deduplicated edges kept by at least one of their ends.
 */
function shownEdges(matrix: number[][], n: number): Edge[] {
  const seen = new Set<string>()
  const edges: Edge[] = []
  for (let i = 0; i < n; i++) {
    const neighbors: { j: number; w: number }[] = []
    for (let j = 0; j < n; j++) if (j !== i && matrix[i][j] > 0) neighbors.push({ j, w: matrix[i][j] })
    if (neighbors.length === 0) continue
    neighbors.sort((a, b) => b.w - a.w)
    const max = neighbors[0].w
    const kept = neighbors.filter((nb) => nb.w >= EDGE_RATIO * max).slice(0, EDGE_MAX)
    for (const { j, w } of kept) {
      const a = Math.min(i, j)
      const b = Math.max(i, j)
      const key = `${a}-${b}`
      if (!seen.has(key)) {
        seen.add(key)
        edges.push({ i: a, j: b, weight: w })
      }
    }
  }
  return edges
}

/**
 * @property {CardSource[]} cards Card set in matrix order.
 * @property {number[][]} matrix `matrix[i][j]` = number of submissions with cards i and j in one
 *   group.
 * @property {number} submissionCount Number of submissions, normalizes the edge weights.
 * @property {Schema | null} [schema] Reference schema whose category colors frame the nodes.
 */
interface CardGraphProps {
  cards: CardSource[]
  matrix: number[][]
  submissionCount: number
  schema?: Schema | null
}

/**
 * Force-directed card graph of the analysis: cards that are often grouped together pull
 * together.
 *
 * The layout uses all edges so the graph stays connected, but only the strongest edges per card
 * are drawn ({@link shownEdges}); edge width and opacity scale with the share of submissions.
 * With a schema, node rings take the category color and a legend is shown.
 *
 * @param {CardGraphProps} props Component props.
 * @param {CardSource[]} props.cards Card set in matrix order.
 * @param {number[][]} props.matrix Aggregate co-occurrence matrix.
 * @param {number} props.submissionCount Number of submissions.
 * @param {Schema | null} [props.schema=null] Reference schema for the node colors.
 * @returns {JSX.Element} SVG graph with optional legend, or a hint when there are no edges.
 */
export function CardGraph({ cards, matrix, submissionCount, schema = null }: CardGraphProps) {
  const { lang, t } = useLang()
  const denom = Math.max(submissionCount, 1)

  const { nodes, links } = useMemo(() => {
    const n = cards.length
    const nodes: GraphNode[] = cards.map((c) => ({
      id: c.id,
      image: c.image,
      color: schema ? (categoryOf(c, schema)?.color ?? null) : null,
    }))
    /**
     * Resolves an index edge to a link between simulation nodes.
     *
     * @param {Edge} e Edge by matrix index.
     * @returns {GraphLink} Link between the two nodes.
     */
    const toLink = (e: Edge): GraphLink => ({
      source: nodes[e.i],
      target: nodes[e.j],
      weight: e.weight,
    })
    const simLinks = allEdges(matrix, n).map(toLink)
    const links = shownEdges(matrix, n).map(toLink)

    const sim = forceSimulation(nodes)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(simLinks)
          .distance((l) => 210 - 150 * (l.weight / denom))
          .strength((l) => 0.15 + 0.85 * (l.weight / denom)),
      )
      .force('charge', forceManyBody().strength(-350))
      .force('collide', forceCollide(R + 8))
      .force('center', forceCenter(0, 0))
      .stop()
    for (let i = 0; i < TICKS; i++) sim.tick()
    return { nodes, links }
  }, [cards, matrix, denom, schema])

  const pad = R + 26 // room for the letter below the node
  const xs = nodes.map((d) => d.x ?? 0)
  const ys = nodes.map((d) => d.y ?? 0)
  const minX = Math.min(...xs) - pad
  const minY = Math.min(...ys) - pad
  const w = Math.max(...xs) + pad - minX
  const h = Math.max(...ys) + pad - minY

  if (links.length === 0) {
    return (
      <p className="muted">{t.ana.charts.graphEmpty}</p>
    )
  }

  return (
    <div className="cardgraph-wrap">
      <svg
        className="cardgraph"
        viewBox={`${minX} ${minY} ${w} ${h}`}
        role="img"
        aria-label={t.ana.charts.graphAria}
      >
        <defs>
          {nodes.map((d) => (
            <clipPath key={d.id} id={`clip-${d.id}`}>
              <circle r={R} cx={0} cy={0} />
            </clipPath>
          ))}
        </defs>
        {links.map((l, i) => {
          const frac = l.weight / denom
          return (
            <line
              key={i}
              x1={l.source.x}
              y1={l.source.y}
              x2={l.target.x}
              y2={l.target.y}
              stroke="#94a3b8"
              strokeOpacity={0.35 + 0.5 * frac}
              strokeWidth={1.5 + 6 * frac}
            />
          )
        })}
        {nodes.map((d) => (
          <g key={d.id} transform={`translate(${d.x},${d.y})`}>
            <image
              href={d.image}
              x={-R}
              y={-R}
              width={2 * R}
              height={2 * R}
              clipPath={`url(#clip-${d.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle
              r={R}
              fill="none"
              stroke={d.color ?? UNGROUPED_COLOR}
              strokeWidth={d.color ? 4 : 2}
            />
            <text y={R + 17} textAnchor="middle" className="cardgraph__letter">
              {d.id}
            </text>
          </g>
        ))}
      </svg>
      {schema && (
        <div className="cardgraph__legend">
          <Legend
            items={schema.categories.map((c) => ({ key: c.key, label: c.label[lang], color: c.color }))}
          />
        </div>
      )}
    </div>
  )
}
