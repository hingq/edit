const RegQuote = /^(>\s|》\s)/ // 引用
// const RegCode = /^(```|```)/ // 代码块
const RegHead = /^#{1,6}\s/ // 标题z
const RegCode = /^(```|···)\s/ // 代码块
const RegOrderList = /^(1\.)\s/ // 有序列表
//markdown语法监听
export const listenCode = (api): boolean => {
  const index = api.blocks.getCurrentBlockIndex()
  const block = api.blocks.getBlockByIndex(index) || null

  if (!block) return false
  const text = block.holder.innerText
  if (text && RegQuote.test(text)) {
    /** 引用 */
    insetBlock('quote', api, { text }, index, block, RegQuote)
  } else if (text && RegHead.test(text)) {
    /** 标题 */
    const level = text.match(/#/g)?.length || 1
    insetBlock('header', api, { text: text, level: level }, index, block, RegHead)
  } else if (text && RegCode.test(text)) {
    /** 代码块 */
    insetBlock('code', api, { text: text }, index, block, RegCode)
  } else if (text && RegOrderList.test(text)) {
    // orderList
    insetBlock('orderList', api, { text: text }, index, block, RegOrderList)
  }
  return true
}

interface config {
  text: string
  level?: number
}

// 块插入
function insetBlock(
  type: string,
  api,
  config: config,
  index: number,
  block: any,
  reg: RegExp
): void {
  const newText = config.text.replace(reg, '')

  block.holder.innerText = newText
  api.blocks.insert(
    type,
    { text: newText, level: config.level },
    {},
    index > 0 ? index : 0,
    true,
    true
  )
  setTimeout(() => {
    api.caret.focus(true)
  }, 100)
}

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
