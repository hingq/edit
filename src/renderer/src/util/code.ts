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

  static get toolbox(): toolConfig {
    return {
      title: 'Code',
      icon: '<pre style="font-size:18px;">{}</pre>'
    }
  }

  constructor({ data, api }: BlockToolConstructorOptions) {
    this.api = api
    this.data = Object.assign({ code: '', language: 'javascript' }, data)
    this.wrapper = document.createElement('div')
  }

  render(): HTMLElement {
    this.wrapper.classList.add('code-block-wrapper')

    // 语言选择框
    const select = document.createElement('select')
    select.innerHTML = `
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
      <option value="html">HTML</option>
      <option value="css">CSS</option>
      <option value="python">Python</option>
    `
    select.value = this.data.language
    select.addEventListener('change', (e) => {
      this.data.language = (e.target as HTMLSelectElement).value
      this.codeElement.className = `language-${this.data.language}`
      this.highlightCode() // 重新高亮
    })

    // 代码块
    const pre = make('pre', [`language-${this.data.language}`])
    this.codeElement = make('code', [], { contentEditable: 'true' })
    this.codeElement.innerText = this.data.code || ''
    pre.appendChild(this.codeElement)
    this.wrapper.appendChild(select)
    this.wrapper.appendChild(pre)

    // 监听输入事件，更新 this.data.code
    this.codeElement.addEventListener('input', () => {
      this.data.code = this.codeElement.innerText
      // this.highlightCode()
      setTimeout(() => {
        this.highlightCode()
      }, 1000)
    })

    // 监听代码元素变化并进行高亮
    // this.observeCodeChange()

    return this.wrapper
  }

  save() {
    return this.data
  }
  // 回车换行的默认行为
  public static get enableLineBreaks(): boolean {
    return true
  }
  private highlightCode() {
    // 调用 highlight.js 的高亮方法
    // 转义 HTML，避免 Highlight.js 的安全警告
    this.codeElement.innerHTML = escapeHTML(this.data.code)(
      // 执行高亮
      window as any
    ).hljs.highlightElement(this.codeElement)
    ;(window as any).hljs.highlightElement(this.codeElement)
  }

  private observeCodeChange(): void {
    const observer = new MutationObserver((mutations) => {
      console.log('mutations', mutations[0].target)
      this.highlightCode(mutations[0].target)
    })

    observer.observe(this.codeElement, { childList: true, subtree: true, characterData: true })
  }
}

export default CodeBlock
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
