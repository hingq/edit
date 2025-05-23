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
    this.container.setAttribute('data-type', 'link')
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
      href: href || 'https://www.example.com',
      title: '按住Ctrl的同时点击鼠标进行跳转',
      contentEditable: (!this.readOnly).toString(),
      target: '_blank'
    }) as HTMLAnchorElement
  }

  // 直接在块内编辑链接的 text 和 href
}
