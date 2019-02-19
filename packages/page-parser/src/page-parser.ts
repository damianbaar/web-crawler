import axios from 'axios'
import { parse, Node, HTMLElement, NodeType } from 'node-html-parser'
import { uniq } from 'fp-ts/lib/Array'
import { ordString } from 'fp-ts/lib/Ord'
import { contramap } from 'fp-ts/lib/Setoid'
import { pipe, identity, not } from 'fp-ts/lib/function'
import { parse as parseURL, UrlWithStringQuery } from 'url'
import pMap from 'p-map'

type Labels = [string, string]
type URL = string
type Error = string
interface AnchorDescriptor {
  labels: Labels
  url: URL
  error?: Error
  parent: string
  resolved: boolean
  links: AnchorDescriptor[]
}

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
    html.map(d => ({
      labels: getTextFromNode(d.childNodes).filter(Boolean),
      url: d.attributes.href
    }) as AnchorDescriptor)

const urlSetoid =
  contramap(({ url }: AnchorDescriptor) => url, ordString)

export const skipDuplicates = uniq(urlSetoid)

export const parseAnchors = pipe(
  parseHTML,
  getAnchors,
  anchorsToTuple,
  skipDuplicates
)

const isURLRelative =
  (urlString: string) =>
    !(urlString.indexOf('http://') === 0 || urlString.indexOf('https://') === 0)

export const filterOutLinksOutsideDomain =
  ({ hostname }: UrlWithStringQuery) =>
    (hrefs: AnchorDescriptor[]) =>
      hrefs.filter(({ url }) =>
        url
          ? (hostname === parseURL(url).hostname || isURLRelative(url))
          : false
      )

const withFiltering = pipe(
  parseURL,
  filterOutLinksOutsideDomain
)

export const getURLsFromPage =
  (baseURL: string, withDomainFiltering: boolean = true): Promise<AnchorDescriptor[]> =>
    axios
      .get(baseURL)
      .then(d =>
        Promise
          .resolve(parseAnchors(d.data))
          .then(withDomainFiltering
            ? withFiltering(baseURL)
            : identity
          )
        , error =>
          ((error.response && error.response.status === 404
            ? [{ error: error.response.status, url: baseURL, links: [] }]
            : [{ error: 'unknown error', url: baseURL, links: [] }] as unknown) as AnchorDescriptor[])
      )

type Tree = Record<string, AnchorDescriptor>

const checkIfShouldSkip =
  (tree: Tree, baseURL: string) =>
    ({ url, error }: AnchorDescriptor) =>
      !!(tree[url] || error || url === baseURL)

interface TraverseOptions {
  concurrency: number
}

const doEffect = <P>(effect: (val: P) => void) => (result: P) => {
  effect(result)
  return result
}

// better would be to go with monad transformer -> StateTaskEither
export const traversePage =
  (baseURL: string, options: TraverseOptions = { concurrency: 20 }, tree: Tree = {}): Promise<Tree> =>
    getURLsFromPage(baseURL)
      .then(doEffect((links) => { tree[baseURL] = { ...tree[baseURL], links, url: baseURL } }))
      .then(hrefs => hrefs.filter(not(checkIfShouldSkip(tree, baseURL))))
      .then(hrefs =>
        hrefs
          .map(doEffect((link) => {
            tree[link.url] = {
              ...tree[link.url],
              ...link,
              parent: baseURL,
            } as AnchorDescriptor
          })))
      .then(hrefs => hrefs.map(({ url }) => url))
      .then(pagesToTraverse =>
        pMap(pagesToTraverse, link =>
          traversePage(link, options, tree), options)
      )
      .then(_ => tree)

import { unflatten } from 'un-flatten-tree'

export const drawTree =
  (root: URL) =>
    (lookup: Tree) => {
      const tree = unflatten(Object.values(lookup),
        (node: AnchorDescriptor, parentNode: AnchorDescriptor) => node.parent === parentNode.url,
        (node: AnchorDescriptor, parentNode: AnchorDescriptor) => parentNode.links.push(node),
        node => ({ ...node, links: [] })
      )
      return { [root]: tree }
    }

export const printSiteMap =
  (baseURL: URL, options: TraverseOptions = { concurrency: 20 }) =>
    traversePage(baseURL, options)
      .then(drawTree(baseURL))