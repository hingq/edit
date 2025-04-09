import { API, BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
import { make } from '@editorjs/dom'
import { LinkIcon } from '@renderer/util/icon/link'

interface LinkData {
  text: string
  href: string
}

export default class Link implements BlockTool {
  private api: API
  private data: LinkData
  private container!: HTMLAnchorElement
  private readOnly: boolean
  private Regex: RegExp
  constructor({ data, api, readOnly }: BlockToolConstructorOptions<LinkData>) {
    this.api = api
    this.readOnly = readOnly
    this.data = data || { text: '', href: '' }
  }

  public static get toolbox() {
    return {
      title: 'Link',
      icon: LinkIcon
    }
  }

  public static get enableLineBreaks() {
    return true
  }

  public static get isReadOnlySupported() {
    return true
  }

  render(): HTMLElement {
    const { text, href } = this.data

    this.container = this.getLink(href)

    this.container.textContent = text || href || '链接文本'

    return this.container
  }

  save(): LinkData {
    return {
      text: this.container.textContent || '',
      href: this.container.getAttribute('href') || ''
    }
  }
  getLink(href: string): HTMLAnchorElement {
    return make('a', null, {
      href: href || '#',
      contentEditable: (!this.readOnly).toString(),
      target: '_blank'
    }) as HTMLAnchorElement
  }

  // 直接在块内编辑链接的 text 和 href
}
function getEditDiv() {
  return make('div', null, {
    contentEditable: 'true',
    innerText: `[name](https://example.com)`
  })
}
export function handleEdit(e: any, api, index) {
  e.preventDefault()
  e.stopPropagation()
  const Regex = /\[(.*?)\]\((.*?)\)/
  const newText = getEditDiv()
  newText.setAttribute('data-type', 'link')
  newText.addEventListener('blur', () => {
    const [_, text, href] = newText.innerText.match(Regex) || []
    const data = {
      text: text || '请检查输入',
      href: href || ''
    }
    api.blocks.insert('link', data, {}, index, true, true)
  })
  const parent = e.target!.parentNode as HTMLAnchorElement
  parent.replaceChild(newText, e.target)
  newText.focus() //手动聚焦，处理blur事件被触发
}
