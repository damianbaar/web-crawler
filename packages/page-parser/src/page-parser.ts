import axios from 'axios'
import { parse, Node, HTMLElement, NodeType } from 'node-html-parser'
import { uniq } from 'fp-ts/lib/Array'
import { ordString } from 'fp-ts/lib/Ord'
import { contramap } from 'fp-ts/lib/Setoid'
import { pipe } from 'fp-ts/lib/function'

type Labels = [string, string]
type URL = string
type Hrefs = [Labels, URL]
const UnknownLabel = 'cannot_determine_label'

export const trimText =
  (nodes: Node) =>
    nodes.text.trim().replace(/\r\n/g, '')

export const isTextNode =
  (nodes: Node) =>
    nodes.nodeType === NodeType.TEXT_NODE

export const mergeChildNodes =
  (nodes: Node[]) =>
    nodes.map(a => a.childNodes)
      .reduce((acc, next) => [...acc, ...next], [])

export const getOnlyTextNodes =
  (nodes: Node[]) =>
    nodes.filter(isTextNode)
      .map(trimText)
      .filter(Boolean)

// Tupple: [title, subtitle]
export const getTextFromNode =
  (d: Node[]): string[] => {
    if (d.length === 0) return [UnknownLabel]
    const textNodes = getOnlyTextNodes(d)
    return textNodes.length === 0
      ? getTextFromNode(mergeChildNodes(d))
      : d.map(trimText)
  }

export const parseHTML =
  (htmlString: string) =>
    parse(htmlString) as HTMLElement

export const getAnchors =
  (html: HTMLElement) =>
    html.querySelectorAll('a')

export const anchorsToTuple =
  (html: HTMLElement[]) =>
    html.map(d => [
      getTextFromNode(d.childNodes),
      d.attributes.href
    ]) as Hrefs[]

const urlSetoid =
  contramap((f: Hrefs) => f[1], ordString)

export const skipDuplicates = uniq(urlSetoid)

export const parseAnchors = pipe(
  parseHTML,
  getAnchors,
  anchorsToTuple,
  skipDuplicates
)

export const getURLsFromPage =
  (url: string) =>
    axios
      .get(url)
      .then(r => parseAnchors(r.data))
