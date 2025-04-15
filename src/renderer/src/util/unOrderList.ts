import { API, BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
import { make } from '@editorjs/dom'

interface unOrderListData {
  text: string
}

export default class unOrderListTool implements BlockTool {
  private api: API
  private data: unOrderListData
  private container!: HTMLOListElement
  private readOnly: boolean

  constructor({ data, api, readOnly }: BlockToolConstructorOptions<unOrderListData>) {
    this.api = api
    this.readOnly = readOnly
    this.data = data || ''
  }

  // 工具栏
  public static get toolbox() {
    return {
      title: 'unOrdered List',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24"><path d="M8 6h13v2H8zM8 11h13v2H8zM8 16h13v2H8zM3 6h1v1H3zM3 11h1v1H3zM3 16h1v1H3z"/></svg>`
    }
  }
  // 处理换行
  public static get enableLineBreaks(): boolean {
    return true
  }

  public static get isReadOnlySupported(): boolean {
    return true
  }

  render(): HTMLElement {
    this.container = make('ul', [], {
      contentEditable: (!this.readOnly).toString()
    }) as HTMLOListElement
    const newLi = make('li', [], {
      innerText: this.data.text || '',
      contentEditable: (!this.readOnly).toString()
    })
    this.container.appendChild(newLi)
    this.container.setAttribute('data-type', 'unOrderList')
    return this.container
  }

  save(): string[] {
    const items: string[] = []
    this.container.querySelectorAll('li').forEach((li) => {
      const text = li.textContent?.trim() || ''
      if (text) items.push(text)
    })

    return items
  }
}
