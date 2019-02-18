import axios from 'axios'
import { parse, Node, HTMLElement, NodeType } from 'node-html-parser'
import { uniq } from 'fp-ts/lib/Array'
import { ordString } from 'fp-ts/lib/Ord'
import { contramap } from 'fp-ts/lib/Setoid'
import { pipe, identity } from 'fp-ts/lib/function'
import { parse as parseURL, UrlWithStringQuery } from 'url'
import pMap from 'p-map'

type Labels = [string, string]
type URL = string
type AnchorDescriptor = [Labels, URL]

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
    ]) as AnchorDescriptor[]

const urlSetoid =
  contramap(([_, linkURL]: AnchorDescriptor) =>
    linkURL, ordString)

export const skipDuplicates = uniq(urlSetoid)

export const parseAnchors = pipe(
  parseHTML,
  getAnchors,
  anchorsToTuple,
  skipDuplicates
)

export const filterOutLinksOutsideDomain =
  ({ hostname }: UrlWithStringQuery) =>
    (hrefs: AnchorDescriptor[]) =>
      hrefs.filter(([_, href]) => href.indexOf(hostname as string) > -1)

const withFiltering = pipe(
  parseURL,
  filterOutLinksOutsideDomain
)

export const getURLsFromPage =
  (baseURL: string, withDomainFiltering: boolean = true) =>
    axios
      .get(baseURL)
      .then(r => parseAnchors(r.data))
      .then(withDomainFiltering
        ? withFiltering(baseURL)
        : identity
      )

interface TreeNode {
  details: AnchorDescriptor
  parent: URL
  links: AnchorDescriptor[]
}

type Tree = Record<string, TreeNode>

const checkIfAlreadyVisited =
  (tree: Tree) =>
    ([_, linkURL]: AnchorDescriptor) =>
      !tree[linkURL]

interface TraverseOptions {
  concurrency: 2
}

const doEffect = <P>(effect: (val: P) => void) => (result: P) => {
  effect(result)
  return result
}

// better would be to go with monad transformer -> StateTaskEither
export const traversePage =
  (baseURL: string, options: TraverseOptions = { concurrency: 2 }, tree: Tree = {}): Promise<Tree> =>
    getURLsFromPage(baseURL)
      .then(doEffect((links) => { tree[baseURL] = { ...tree[baseURL], links } }))
      .then(hrefs => hrefs.filter(checkIfAlreadyVisited(tree)))
      .then(hrefs =>
        hrefs
          .map(doEffect(([labels, link]) => {
            tree[link] = {
              ...tree[link],
              details: [labels, link],
              parent: baseURL,
            }
          })))
      .then(hrefs => hrefs.map(([_, link]) => link))
      .then(pagesToTraverse =>
        pMap(pagesToTraverse, link =>
          traversePage(link, options, tree), options)
      )
      .then(_ => tree)

const resolveTreeNode =
  (lookup: Tree, node: string, parent: string): TreeNode => ({
    ...lookup[node],
    links: lookup[node]
      .links
      .map(desc =>
        desc[1] === parent
          ? desc
          : resolveTreeNode(lookup, desc[1], node))
      .filter(Boolean) as AnchorDescriptor[]
  })

export const drawTree =
  (root: URL) =>
    (lookup: Tree) => {
      const rootNode = lookup[root]
      return {
        [root]: {
          ...rootNode,
          links: rootNode
            .links
            .map((desc) =>
              lookup[desc[1]].links ?
                resolveTreeNode(lookup, desc[1], lookup[desc[1]].parent)
                : desc
            )
        }
      }
    }

export const printSiteMap =
  (baseURL: URL) =>
    traversePage(baseURL)
      .then(drawTree(baseURL))