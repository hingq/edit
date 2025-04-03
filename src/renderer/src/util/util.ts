export const listenCode = (api): boolean => {
  const RegQuote = /^(>\s|》\s)/ // 引用
  // const RegCode = /^(```|```)/ // 代码块
  const RegHead = /^#{1,6}\s/ // 标题z

  const index = api.blocks.getCurrentBlockIndex()
  const block = api.blocks.getBlockByIndex(index) || null

  if (!block) return false
  const text = block.holder.innerText
  if (text && RegQuote.test(text)) {
    insetBlock('quote', api, { text }, index, block, RegQuote)
  } else if (text && RegHead.test(text)) {
    const level = text.match(/#/g)?.length || 1
    insetBlock('header', api, { text: text, level: level }, index, block, RegHead)
  }
  return true
}
interface config {
  text: string
  level?: number
}
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
