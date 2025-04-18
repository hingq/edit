/*
 * 处理快捷语法
 * */
import { make } from '@editorjs/dom'
const RegQuote = /^(>\s|》\s)/ // 引用
// const RegCode = /^(```|```)/ // 代码块
const RegHead = /^#{1,6}\s/ // 标题z
const RegCode = /^(```|···)\s/ // 代码块
const RegOrderList = /(1\.)\s/ // 有序列表
const RegLink = /^\[(.*)\]\((.*)\)\s/ // 链接
const RegUnOrderList = /(-|\+)\s/ // 无序列表

//markdown语法监听
export const listenCode = (api): boolean => {
  const index = api.blocks.getCurrentBlockIndex()
  const block = api.blocks.getBlockByIndex(index) || null

  if (!block) return false
  const el = getCurrentEle()
  if (!el) return false
  const text = getCurrentEle()?.innerText
  if (text && RegQuote.test(text)) {
    /* 引用 */
    insetBlock('quote', api, { text: text }, index, block, RegQuote)
  } else if (text && RegHead.test(text)) {
    /*标题 */
    const level = text.match(/#/g)?.length || 1
    insetBlock('header', api, { text: text, level: level }, index, block, RegHead)
  } else if (text && RegCode.test(text)) {
    /*代码块 */
    insetBlock('code', api, { text: text }, index, block, RegCode)
  } else if (text && RegOrderList.test(text)) {
    /*有序表*/
    setOlorLi(block, el, 'orderList', api, index, text)
  } else if (text && RegLink.test(text)) {
    /*链接*/
    const name = text.match(RegLink)?.[1] || ''
    const href = text.match(RegLink)?.[2] || ''
    insetBlock('link', api, { text: name, href }, index, block, RegLink)
  } else if (text && RegUnOrderList.test(text)) {
    /*无序表*/
    setOlorLi(block, el, 'unorderedList', api, index, text)
  }
  return true
}
/*
统一处理ol和li
* */
function setOlorLi(block, el, type: 'unorderedList' | 'orderList', api, index, text) {
  /*
   *只匹配列表里面的嵌套以及paragraph的正则
   * 有序里面可以嵌套无序，无序里面可以嵌套有序
   * */
  if (block.name === 'unorderedList' || block.name === 'orderList') {
    el!.innerText = ''
    const ul: HTMLElement = make(type === 'unorderedList' ? 'ul' : 'ol')
    const li = make('li')
    ul.appendChild(li)
    el?.parentElement?.appendChild(ul)
    setCursorToElement(li)
  } else if (block.name === 'paragraph') {
    insetBlock(
      type,
      api,
      { text: text },
      index,
      block,
      type === 'unorderedList' ? RegUnOrderList : RegOrderList
    )
  }
}

interface config {
  text: string
  level?: number
  href?: string
}

// 块插入
function insetBlock(
  type: string, //类型
  api, //editor api
  config: config,
  index: number,
  block: any, //当前快
  reg: RegExp //正则
): void {
  const cfg: config = {
    text: config.text,
    level: config.level || undefined,
    href: config.href || undefined
  }
  if (type !== 'link') {
    cfg.text = cfg.text.replace(reg, '').trim()
  }
  block.holder.innerText = ''
  api.blocks.insert(type, cfg, {}, index > 0 ? index : 0, true, true)
  setTimeout(() => {
    api.caret.focus(true)
  }, 100)
}
/*设置光标*/
export function setCursorToElement(el: HTMLElement) {
  const range = document.createRange()
  const sel = window.getSelection()
  range.selectNodeContents(el)
  range.collapse(false) // 光标置于末尾
  sel?.removeAllRanges()
  sel?.addRange(range)
  el.focus()
}
/*
 *@description: 获取当前选中的元素
 *  */
export const getCurrentEle = (): HTMLElement | undefined => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  let node = selection.getRangeAt(0).startContainer

  // 如果是文本节点（nodeType === 3），获取它的父节点
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode as Node
  }

  return node instanceof HTMLElement ? node : undefined
}
