import EditorJS from '@editorjs/editorjs'
import Header from './util/head'
// import Quote from '@editorjs/quote'
import Quote from './util/quote'
import LinkTool from '@editorjs/link'
import CodeBlock from '@renderer/util/code'
import { useRef, useEffect, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { listenCode } from '@renderer/util/util'

function App(): JSX.Element {
  const editorRef = useRef<EditorJS | null>(null)
  const isInitialized = useRef(false) // 防止重复初始化
  useEffect(() => {
    if (isInitialized.current) return // 避免重复初始化
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
            inlineToolbar: true
          },
          quote: {
            class: Quote,
            inlineToolbar: true
          },
          linkTool: {
            inlineToolbar: true,
            class: LinkTool as any
          }
        },
        onReady() {
          console.log('Editor.js is ready')
          // setEditorReady(true) // 仅在成功初始化后更新状态
        },
        onChange: (api) => {
          listenCode(api)
        }
      })
    }

    if (!editorRef.current) {
      setTimeout(initEditor, 100) // 延迟初始化，确保 `#editorjs` 已被渲染
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
      }
      editorRef.current = null
    }
  }, [])
  const inertBlock = (index: number, block: any, editor: any, type: string, level?: any) => {
    const text = block.holder.innerText
    editor.blocks.insert(type, { text: text || '', level }, {}, index > 0 ? index : 0, false, true)
    setTimeout(() => {
      editor.focus(true)
    }, 100)
  }

  // 处理快捷键
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

  return (
    <>
      {/*<span className="ts">typescript</span>*/}
      <div
        onKeyDown={keyfunction}
        id="editorjs"
        style={{ width: '500px', height: '500px', border: '1px solid #ccc', padding: '10px' }}
        spellCheck={false}
        className="markdown-body"
      ></div>
    </>
  )
}

export default App
