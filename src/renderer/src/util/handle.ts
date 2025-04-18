import { KeyboardEvent } from 'react'
import { getCurrentEle, setCursorToElement } from '@renderer/util/util'
import { make } from '@editorjs/dom'

export function isLinkDelete(e): boolean {
  return (
    e.key === 'Backspace' &&
    e.target.innerText.trim().length === 0 &&
    e.target.getAttribute('data-type') === 'link'
  )
}
export function isUnOrderListDelete(e): boolean {
  return e.key === 'Backspace' && e.target.getAttribute('data-type') === 'unOrderList'
}

// 引用删除
export function isQuoteDelete(e): boolean {
  return (
    e.key === 'Backspace' &&
    e.target.getAttribute('data-type') === 'quote' &&
    e.target.innerText.trim().length === 0
  )
}

// 标题删除
export function isdeleteHead(e): boolean {
  return (
    e.key === 'Backspace' &&
    e.target.getAttribute('data-type') === 'header' &&
    e.target.innerText.trim().length === 0
  )
}
// title
export function isHeading(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6'
}
// code 删除
export function isBackspaceOnEmptyCodeBlock(key: string, target: HTMLElement): boolean {
  return key === 'Backspace' && target.contentEditable === 'true' && target.tagName === 'CODE'
}
// enter键
export function isEnterOnOrderedList(key: string, target: HTMLElement, el): boolean {
  return key === 'Enter' && target instanceof HTMLOListElement && el.parentElement !== target
}
export function isEnterOnunOrderedList(key: string, target: HTMLElement, el): boolean {
  return key === 'Enter' && target instanceof HTMLUListElement && el.parentElement !== target
}
export function isBackspaceOnOrderedList(key: string, target: HTMLElement): boolean {
  return key === 'Backspace' && target instanceof HTMLOListElement
}

// 处理下键逻辑
export function isArrowDown(key: string, target: HTMLElement): boolean {
  return key === 'ArrowDown' && target instanceof HTMLOListElement
}

export function deleteCurrentBlock(editorApi: any): void {
  const index = editorApi.blocks.getCurrentBlockIndex?.()
  if (index !== -1) {
    editorApi.blocks.delete(index)
  }
}

/**
 *
 * 处理order\unOrder 删除逻辑
 */
export function handleOrderedListBackspace(target: any, editorApi: any): void {
  /*
   * 处理orderList删除逻辑*/
  const currentLi = getCurrentEle()
  if (!currentLi) return
  const text = currentLi.innerText
  /*文本为空时，需要判断是否只有一个节点*/
  if (text.trim().length === 0) {
    // //trim()用于清空空格
    deleteLi(currentLi.parentElement as HTMLElement, currentLi, target, editorApi)
  } else {
    // 存在文字时，进行切片操作
    const length = text.length
    currentLi.innerText = text.slice(0, length - 1)
    setCursorToElement(currentLi)
  }
}

/**
 * @description: 处理嵌套情况,target指向ul/ol
 * @param {HTMLElement} node
 * @param {target}
 * */
const deleteLi = (node: HTMLElement, cur: HTMLElement, target, edtior): void => {
  let pre = (cur.previousElementSibling as HTMLLIElement) || null
  //处理嵌套
  if (!pre && node != target) pre = node.previousElementSibling as HTMLLIElement
  if (!pre) {
    deleteCurrentBlock(edtior) //只剩下一个节点时，删除当前块
    return
  }
  if (pre && node.children.length === 1) node.remove()
  node.removeChild(cur)
  setCursorToElement(pre) //光标移动
}

export const inertBlock = (
  index: number,
  block: any,
  editor: any,
  type: string,
  level?: any
): void => {
  const text = block.holder.innerText
  editor.blocks.insert(type, { text: text || '', level }, {}, index > 0 ? index : 0, false, true)
  setTimeout(() => {
    editor.focus(true)
  }, 100)
}

function getEditDiv(name: string = 'name', href: string = 'https://www.example.com'): HTMLElement {
  return make('div', null, {
    contentEditable: 'true',
    innerText: `[${name}](${href})`
  })
}
export function handleEdit(e: any, api: any, index: number): void {
  e.preventDefault()
  e.stopPropagation()
  const Regex = /\[(.*?)\]\((.*?)\)/
  const text = e.target.innerText
  const href = e.target.getAttribute('href')
  const newText = getEditDiv(text, href)
  newText.setAttribute('data-type', 'link')
  newText.addEventListener('blur', () => {
    const [_, text, href] = newText.innerText.match(Regex) || []
    if (!text) return
    if (text.trim().length === 0) return
    const data = {
      text: text || '请检查输入',
      href: href || ''
    }
    api.blocks.insert('link', data, {}, index, true, true)
  })
  const parent = e.target!.parentNode as HTMLAnchorElement
  parent.replaceChild(newText, e.target)
  newText.focus() //手动聚焦，处理blur事件被触发
}
