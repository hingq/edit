import EditorJS, { API } from '@editorjs/editorjs'
import Header from './util/head'
import { make } from '@editorjs/dom'
import Quote from './util/quote'
// @ts-ignore
import Link from '@renderer/util/Link.ts'
import CodeBlock from '@renderer/util/code'
import { KeyboardEvent, useEffect, useRef } from 'react'
import { getCurrentEle, listenCode, setCursorToElement } from '@renderer/util/util'
import OrderListTool from '@renderer/util/orderList'
import { handleEdit } from '@renderer/util/Link'

function bindGlobalBlockEvents(editorApi: any) {
  const el = document.getElementById('editorjs')
  if (!el) return

  const handleKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const key = e.key

    // code 删除
    if (isBackspaceOnEmptyCodeBlock(key, target)) {
      const isempty = target.children.length === 0 && target.innerText.length === 0
      if (isempty) deleteCurrentBlock(editorApi)
      return
    }
    // order enter
    if (isEnterOnOrderedList(key, target)) {
      e.preventDefault()
      const newLi = make('li', [], { contentEditable: 'true' }) as HTMLLIElement
      target.appendChild(newLi)
      setCursorToElement(newLi) //处理光标位置
      return
    }

    /*快捷键*/
    if (isHeading(e)) {
      e.preventDefault()
      keyfunction(e, editorApi)
    }
  }
  // head快捷键
  const keyfunction = (e: KeyboardEvent, editor: API): void => {
    const index = editor.blocks.getCurrentBlockIndex()
    if (index === undefined || index === null) return
    const block = editor.blocks.getBlockByIndex(index) || null
    if (!block) return
    e.preventDefault()
    const level = Number(e.key)

    if (block.name === 'paragraph') {
      inertBlock(index, block, editor, 'header', level)
    } else if (block.name === 'header' && block.holder.querySelector(`h${level}`)) {
      inertBlock(index, block, editor, 'paragraph')
    } else {
      editor.blocks.update(block.id, { name: 'header', level }).then(() => {
        editor.caret.focus(true)
      })
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const text = e.clipboardData?.getData('text') || ''
    const formattedText = text.trimStart()

    const selection = window.getSelection()
    if (!selection?.rangeCount) return

    const range = selection.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(formattedText))
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  // 处理链接点击事件
  function clickLink(e: any) {
    if (e.target.tagName === 'A' && (e.ctrlKey || e.metaKey)) {
      const url = e.target.getAttribute('href')
      console.log(url)
      window.electron.open(url.toString())
    }
  }
  //处理 ‘/’的冲突
  function handleSlash(e): void {
    if (e.key === '/' && e.target.getAttribute('data-type') === 'link') {
      // e.stopPropagation() //处理冲突
    }
  }
  //需要在捕获阶段，单独处理
  const handleArrowDown = (e: KeyboardEvent): any => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const key = e.key
    if (isArrowDown(key, target)) {
      e.preventDefault()
      e.stopPropagation()

      const currentEl = getCurrentEle()
      if (currentEl) {
        // 处理兄弟节点存在的情况
        const nextLi = currentEl.nextElementSibling as HTMLLIElement
        if (nextLi) {
          setCursorToElement(nextLi)
        } else {
          const index = editorApi.blocks.getCurrentBlockIndex()
          const total = editorApi.blocks.getBlocksCount()
          if (index + 1 === total) {
            editorApi.blocks.insert('paragraph', { text: '' }, {}, index + 1, false, false)
          } else {
            editorApi.caret.setToBlock(index + 1)
          }
        }
      }
    }
  }
  el.addEventListener(
    'keydown',
    (e: any) => {
      // 处理键盘⬇️
      handleArrowDown(e)
      // orderList 删除
      if (isBackspaceOnOrderedList(e.key, e.target)) {
        e.preventDefault()
        e.stopPropagation()
        handleOrderedListBackspace(e.target, editorApi)
        return
      }

      handleSlash(e)
    },
    true
  )
  // 键盘事件
  el.addEventListener('keydown', (e: any) => {
    handleKeydown(e)
  })
  // 粘贴事件
  el.addEventListener('paste', handlePaste, true)
  // 点击事件
  el.addEventListener(
    'click',
    (e: any) => {
      clickLink(e)
      // a标签点击事件
      // bug: a会被复制多次
      if (e.target.tagName === 'A') handleEdit(e, editorApi)
    },
    true
  )
}

// title
function isHeading(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6'
}
// code 删除
function isBackspaceOnEmptyCodeBlock(key: string, target: HTMLElement): boolean {
  return key === 'Backspace' && target.contentEditable === 'true' && target.tagName === 'CODE'
}
// enter键
function isEnterOnOrderedList(key: string, target: HTMLElement): boolean {
  return key === 'Enter' && target instanceof HTMLOListElement
}

function isBackspaceOnOrderedList(key: string, target: HTMLElement): boolean {
  return key === 'Backspace' && target instanceof HTMLOListElement
}

// 处理下键逻辑
function isArrowDown(key: string, target: HTMLElement): boolean {
  return key === 'ArrowDown' && target instanceof HTMLOListElement
}

function deleteCurrentBlock(editorApi: any) {
  const index = editorApi.blocks.getCurrentBlockIndex?.()
  if (index !== -1) {
    editorApi.blocks.delete(index)
  }
}

/*
 * 处理order 删除逻辑
 */
function handleOrderedListBackspace(target: any, editorApi: any) {
  /*
   * 处理orderList删除逻辑*/
  const currentLi = getCurrentEle()
  if (currentLi) {
    const text = currentLi.innerText
    /*文本为空时，需要判断是否只有一个节点*/
    if (text.length === 0) {
      if (target.children.length === 1) {
        editorApi.blocks.delete()
      } else {
        const pre = currentLi.previousElementSibling as HTMLLIElement
        target.removeChild(currentLi)

        setCursorToElement(pre)
      }
    } else {
      // 存在文字时，进行切片操作
      const length = text.length
      currentLi.innerText = text.slice(0, length - 1)
      setCursorToElement(currentLi)
    }
  }
}

const inertBlock = (index: number, block: any, editor: any, type: string, level?: any) => {
  const text = block.holder.innerText
  editor.blocks.insert(type, { text: text || '', level }, {}, index > 0 ? index : 0, false, true)
  setTimeout(() => {
    editor.focus(true)
  }, 100)
}

function App(): JSX.Element {
  const editorRef = useRef<EditorJS | null>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initEditor = () => {
      const holder = document.getElementById('editorjs')
      if (!holder) {
        console.error('Editor holder element not found.')
        return
      }

      editorRef.current = new EditorJS({
        holder: 'editorjs',
        autofocus: true,
        tools: {
          header: {
            class: Header as any,
            inlineToolbar: true
          },
          code: {
            class: CodeBlock as any,
            inlineToolbar: false
          },
          quote: {
            class: Quote,
            inlineToolbar: true
          },
          orderList: {
            class: OrderListTool
          },
          link: {
            class: Link as any,
            inlineToolbar: true,
            config: {
              herf: 'https://example.com/fetchUrl' // Your backend endpoint for url data fetching
            }
          }
        },
        onReady(): void {
          console.log('Editor.js is ready')
        },
        onChange: (api): void => {
          listenCode(api)
        }
      })

      bindGlobalBlockEvents(editorRef.current)
    }

    if (!editorRef.current) {
      setTimeout(initEditor, 100)
    }

    return (): void => {
      if (editorRef.current) {
        editorRef.current.destroy()
      }
      editorRef.current = null
    }
  }, [])

  return (
    <>
      <div id="editorjs" spellCheck={false} className="markdown-body"></div>
    </>
  )
}

export default App
