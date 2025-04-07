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

    this.container = make('a', null, {
      href: href || '#',
      contentEditable: (!this.readOnly).toString(),
      target: '_blank'
    }) as HTMLAnchorElement

    this.container.textContent = text || href || '链接文本'

    // 只有在非只读状态下才允许点击进行编辑
    if (!this.readOnly) {
      this.container.addEventListener('click', this.handleEdit.bind(this))
    }

    return this.container
  }

  save(): LinkData {
    return {
      text: this.container.textContent || '',
      href: this.container.getAttribute('href') || ''
    }
  }

  // 直接在块内编辑链接的 text 和 href
  private handleEdit() {
    const newText = make('div', [], {
      contentEditable: 'true',
      innerText: `[name](https://example.com)`
    })
    newText.addEventListener('blur', () => {
      const Regex = /^\[.*\]\(.*\)/
      console.log(newText.innerText.match(Regex))
    })
    const parent = this.container.parentNode
  }
}
