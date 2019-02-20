import axios from 'axios'
import { parse, Node, HTMLElement, NodeType } from 'node-html-parser'
import { uniq } from 'fp-ts/lib/Array'
import { ordString } from 'fp-ts/lib/Ord'
import { contramap } from 'fp-ts/lib/Setoid'
import { pipe } from 'fp-ts/lib/function'
import { parse as parseURL, resolve, UrlWithStringQuery } from 'url'
import { unflatten } from 'un-flatten-tree'
import pMap from 'p-map'
import debug from 'debug'

const log = debug('log:parser')

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
    nodes
      .map(a => a.childNodes)
      .reduce((acc, next) => [...acc, ...next], [])

export const getOnlyTextNodes =
  (nodes: Node[]) =>
    nodes
      .filter(isTextNode)
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

export const getHTMLElements =
  (html: HTMLElement) =>
    html
      .querySelectorAll('a')
      .concat(
        html.querySelectorAll('img'))

// should be more robust and extensible
export const htmlElementToDescriptor =
  (html: HTMLElement[]) =>
    html.map(d => ({
      labels: d.attributes.alt || getTextFromNode(d.childNodes).filter(Boolean),
      url: d.attributes.href || d.attributes.src
    } as AnchorDescriptor))

const urlSetoid =
  contramap(({ url }: AnchorDescriptor) => url, ordString)

export const skipDuplicates = uniq(urlSetoid)

export const parseAnchors = pipe(
  parseHTML,
  getHTMLElements,
  htmlElementToDescriptor,
  skipDuplicates
)

const isURLRelative =
  (urlString: string) =>
    !(urlString.indexOf('http://') === 0 || urlString.indexOf('https://') === 0)

export const filterOutLinksOutsideDomain =
  ({ hostname }: UrlWithStringQuery) =>
    (url: string) =>
      url
        ? hostname === parseURL(url).hostname
        : false

const shouldFollow = pipe(
  parseURL,
  filterOutLinksOutsideDomain
)

export const getURLsFromPage =
  (baseURL: string): Promise<AnchorDescriptor[]> =>
    axios
      .get(baseURL)
      .then(
        result => parseAnchors(result.data),
        error =>
          ((error.response && error.response.status === 404
            ? [{ error: error.response.status, url: baseURL, links: [] }]
            : [{ error: 'unknown error', url: baseURL, links: [] }] as unknown) as AnchorDescriptor[])
      )

type Tree = Record<string, AnchorDescriptor>

const skipPending =
  (tree: Tree, baseURL: string) =>
    ({ url }: AnchorDescriptor) =>
      !(tree[url] || url === baseURL)

interface TraverseOptions {
  concurrency: number
}

const doEffect = <P>(effect: (val: P) => void) => (result: P) => {
  effect(result)
  return result
}

// TODO - url relative resolution
// 1) #sth
// 2) /sth
const relativeToFullPath =
  (baseUrl: string) =>
    (desc: AnchorDescriptor) => ({
      ...desc,
      url: desc.url && isURLRelative(desc.url) ? resolve(baseUrl, desc.url) : desc.url
    } as AnchorDescriptor)

// better would be to go with monad transformer -> StateTaskEither
export const traversePage =
  (baseURL: string, options: TraverseOptions = { concurrency: 10 }, tree: Tree = {}): Promise<Tree> =>
    getURLsFromPage(baseURL)
      .then(doEffect((links) => { tree[baseURL] = { ...tree[baseURL], links, url: baseURL } }))
      .then(hrefs => hrefs.filter(skipPending(tree, baseURL)))
      // TODO
      // .then(hrefs => hrefs.map(relativeToFullPath(baseURL)))
      .then(hrefs => hrefs.map(
        doEffect((link) => {
          tree[link.url] = {
            ...tree[link.url],
            ...link,
            parent: baseURL,
          } as AnchorDescriptor
        }))
      )
      .then(hrefs => hrefs
        .filter(({ error }) => !error)
        .map(({ url }) => url)
        .filter(shouldFollow(baseURL))
      )
      .then(doEffect((pagesToTraverse) => log(`getting pages from ${baseURL}: ${pagesToTraverse.join('\n')}`)))
      .then(pagesToTraverse =>
        pMap(pagesToTraverse, link =>
          traversePage(link, options, tree), options)
      )
      .then(_ => tree)

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