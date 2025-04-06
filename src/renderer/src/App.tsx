import EditorJS from '@editorjs/editorjs'
import Header from './util/head'
import { make } from '@editorjs/dom'
import Quote from './util/quote'
import LinkTool from '@editorjs/link'
import CodeBlock from '@renderer/util/code'
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from 'react'
import { listenCode, setCursorToElement } from '@renderer/util/util'
import OrderListTool from '@renderer/util/orderList'

function bindGlobalBlockEvents(editorApi: any) {
  const el = document.getElementById('editorjs')
  if (!el) return

  const handleKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const key = e.key

    // code 删除
    if (isBackspaceOnEmptyCodeBlock(key, target)) {
      const isempty = target.children.length === 0
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
    // order 删除
    if (isBackspaceOnOrderedList(key, target)) {
      e.preventDefault()
      handleOrderedListBackspace(target as HTMLOListElement, editorApi)
      return
    }
  }
  const keyfunction = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const index = editor.blocks.getCurrentBlockIndex()
    if (index === undefined || index === null) return
    const block = editor.blocks.getBlockByIndex(index) || null
    if (!block) return

    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
      e.preventDefault()
      const level = Number(e.key)

      if (block.name === 'paragraph') {
        inertBlock(index, block, editor, 'header', level)
      } else if (block.name === 'header' && block.holder.querySelector(`h${level}`)) {
        inertBlock(index, block, editor, 'paragraph')
      } else {
        editor.blocks.update(block.id, { name: 'header', level }).then(() => {
          editor.focus(true)
        })
      }
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
  const handleArrowDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const key = e.key
    if (isArrowDown(key, target)) {
      e.preventDefault()
      e.stopPropagation()
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      const currentEl = range.startContainer as HTMLElement

      if (currentEl) {
        const nextLi = currentEl.nextElementSibling as HTMLLIElement
        if (nextLi) {
          // 处理最后一个位置
        } else {
          console.log('currentEl is null')
          const index = editorApi.blocks.getCurrentBlockIndex()
          const total = editorApi.blocks.getBlocksCount()
          console.log(index, total)
          if (index + 1 === total) {
            editorApi.blocks.insert('paragraph', { text: '' }, {}, index + 1, false, false)
            console.log(editorApi.caret.setToBlock(index + 1))
          } else {
            editorApi.caret.setToBlock(index + 1)
          }
        }
      }
    }
  }
  el.addEventListener('keydown', handleArrowDown, true) //需要在捕获阶段，单独处理
  el.addEventListener('keydown', handleKeydown)
  el.addEventListener('paste', handlePaste, true)
}

function isBackspaceOnEmptyCodeBlock(key: string, target: HTMLElement): boolean {
  return key === 'Backspace' && target.contentEditable === 'true' && target.tagName === 'CODE'
}

function isEnterOnOrderedList(key: string, target: HTMLElement): boolean {
  return key === 'Enter' && target instanceof HTMLOListElement
}

function isBackspaceOnOrderedList(key: string, target: HTMLElement): boolean {
  return key === 'Backspace' && target instanceof HTMLOListElement
}

function isArrowDown(key: string, target: HTMLElement): boolean {
  return key === 'ArrowDown' && target instanceof HTMLOListElement
}

function deleteCurrentBlock(editorApi: any) {
  const index = editorApi.blocks.getCurrentBlockIndex?.()
  if (index !== -1) {
    editorApi.blocks.delete(index)
  }
}

function handleOrderedListBackspace(ol: HTMLOListElement, editorApi: any) {
  const length = ol.children.length
  const isEmpty = ol.innerText.trim() === ''
  if (!isEmpty) return

  if (length > 1) {
    ol.removeChild(ol.lastElementChild as HTMLElement)
  } else {
    editorApi.blocks.delete()
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
          linkTool: {
            inlineToolbar: true,
            class: LinkTool as any
          },
          orderList: {
            class: OrderListTool
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
