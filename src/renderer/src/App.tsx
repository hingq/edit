import EditorJS, { API } from '@editorjs/editorjs'
import { make } from '@editorjs/dom'
// @ts-ignore
import { KeyboardEvent, useEffect, useRef } from 'react'
import { getCurrentEle, listenCode, setCursorToElement } from '@renderer/util/util'

import { Header, Quote, Link, CodeBlock, OrderListTool } from '@renderer/util/index'

import {
  deleteCurrentBlock,
  handleOrderedListBackspace,
  inertBlock,
  isArrowDown,
  isBackspaceOnEmptyCodeBlock,
  isBackspaceOnOrderedList,
  isdeleteHead,
  isHeading,
  isLinkDelete,
  isQuoteDelete,
  handleEdit,
  isUnOrderListDelete
} from '@renderer/util/handle'
import unOrderListTool from '@renderer/util/unOrderList'

function bindGlobalBlockEvents(editorApi: any) {
  const el = document.getElementById('editorjs')
  if (!el) return

  const handleKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const key = e.key

    /*快捷键*/
    if (isHeading(e)) {
      e.preventDefault()
      keyfunction(e, editorApi)
    }
    // code 删除
    if (isBackspaceOnEmptyCodeBlock(key, target)) {
      const isempty = target.children.length === 0 && target.innerText.length === 0
      if (isempty) deleteCurrentBlock(editorApi)
      return
    }
    // 标题删除
    if (isdeleteHead(e)) {
      e.preventDefault()
      deleteCurrentBlock(editorApi)
    }
    // 删除quote
    if (isQuoteDelete(e)) {
      e.preventDefault()
      deleteCurrentBlock(editorApi)
    }
    //链接删除
    if (isLinkDelete(e)) {
      e.preventDefault()
      deleteCurrentBlock(editorApi)
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
      // @ts-ignore
      window.electron.open(url.toString())
    }
  }
  //处理链接中 ‘/’的冲突
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
    // 处理↓键光标逻辑异常
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
      if (isBackspaceOnOrderedList(e.key, e.target) || isUnOrderListDelete(e)) {
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
      if (e.target.tagName === 'A') {
        // index必须在click事件中获取
        handleEdit(e, editorApi, editorApi.blocks.getCurrentBlockIndex())
      }
    },
    {
      capture: true
    }
  )
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
          unorderedList: {
            class: unOrderListTool
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
