import { API, BlockTool, BlockToolConstructorOptions } from '@editorjs/editorjs'
import { make } from '@editorjs/dom'

interface toolConfig {
  title: string
  icon: string
}

class CodeBlock implements BlockTool {
  api: API
  data: { code: string; language: string }
  wrapper: HTMLElement
  codeElement!: HTMLElement

  constructor({ data, api }: BlockToolConstructorOptions) {
    this.api = api
    this.data = Object.assign({ code: '', language: 'javaScript' }, data)
    this.wrapper = document.createElement('div')
  }

  static get toolbox(): toolConfig {
    return {
      title: 'Code',
      icon: '<pre style="font-size:18px;">{}</pre>'
    }
  }

  // 回车换行的默认行为
  public static get enableLineBreaks(): boolean {
    return true
  }

  render(): HTMLElement {
    this.wrapper.classList.add('code-block-wrapper')

    // 语言选择框
    const select = make('span', ['ts', 'lan-span'], { contentEditable: true })
    select.innerText = this.data.language
    select.addEventListener('blur', (e) => {
      const text = (e.target as HTMLElement).innerText.trim()
      if (text.length > 0 && text !== 'no language') {
        this.data.language = text
        this.codeElement.className = `language-${this.data.language}`
        this.highlightCode()
      } else {
        this.data.language = ''
        select.innerText = 'no language'
        this.codeElement.className = `no-highlight`
      }
      // 重新高亮
    })

    // 代码块
    const pre = make('pre', [`language-${this.data.language}`])
    this.codeElement = make('code', [], { contentEditable: 'true' })
    this.codeElement.innerText = this.data.code || ''
    pre.appendChild(this.codeElement)
    this.wrapper.appendChild(select)
    this.wrapper.appendChild(pre)

    this.codeElement.addEventListener('blur', () => {
      this.highlightCode()
    })
    return this.wrapper
  }

  save() {
    return this.data
  }

  private highlightCode() {
    // 调用 highlight.js 的高亮方法
    const _html = (window as any).hljs.highlight(this.codeElement.outerText, {
      language: this.data.language
    })
    this.codeElement.innerHTML = _html.value
  }
}

export default CodeBlock
