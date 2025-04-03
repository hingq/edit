// @ts-ignore
import { IconQuote } from '@codexteam/icons'
import { make } from '@editorjs/dom'
import type {
  API,
  BlockAPI,
  BlockTool,
  ToolConfig,
  SanitizerConfig,
  ConversionConfig
} from '@editorjs/editorjs'

/**
 * Quote Tool`s initial configuration
 */
export interface QuoteConfig extends ToolConfig {
  /**
   * Placeholder text to display in the quote's text input.
   */
  quotePlaceholder?: string

  /**
   * Placeholder text to display in the quote's caption input.
   */
  captionPlaceholder?: string

  /**
   * Default alignment for the quote.
   */
  defaultAlignment?: Alignment
}

/**
 * Quote Tool`s input and output data
 */
export interface QuoteData {
  /**
   * The text of the quote.
   */
  text: string

  /**
   * The caption for the quote.
   */
  caption: string

  /**
   * The alignment of the quote.
   */
  alignment: Alignment
}

/**
 * Constructor params for the Quote tool, use to pass initial data and settings
 */
interface QuoteParams {
  /**
   * Initial data for the quote
   */
  data: QuoteData
  /**
   * Quote tool configuration
   */
  config?: QuoteConfig
  /**
   * Editor.js API
   */
  api: API
  /**
   * Is quote read-only.
   */
  readOnly: boolean
  /**
   * BlockAPI object of Quote.
   */
  block: BlockAPI
}

/**
 * CSS classes names
 */
interface QuoteCSS {
  /**
   * Editor.js CSS Class for block
   */
  baseClass: string
  /**
   * Quote CSS Class
   */
  wrapper: string
  /**
   * Quote CSS Class
   */
  input: string
  /**
   * Quote CSS Class
   */
  text: string
}

/**
 * Enum for Quote Alignment
 */
enum Alignment {
  /**
   * Left alignment
   */
  Left = 'left',
  /**
   * Center alignment
   */
  Center = 'center'
}

/**
 * Quote Tool for Editor.js
 */
export default class Quote implements BlockTool {
  /**
   * The Editor.js API
   */
  private api: API
  /**
   * Is Quote Tool read-only
   */
  private readOnly: boolean

  /**
   * Placeholder for Quote Tool
   */

  /**
   * Quote Tool's data
   */
  private data: QuoteData

  /**
   * Quote Tool's CSS classes
   */
  private css: QuoteCSS

  /**
   * Render plugin`s main Element and fill it with saved data
   * @param params - Quote Tool constructor params
   * @param params.data - previously saved data
   * @param params.config - user config for Tool
   * @param params.api - editor.js api
   * @param params.readOnly - read only mode flag
   */
  constructor({ data, config, api, readOnly }: QuoteParams) {
    const { DEFAULT_ALIGNMENT } = Quote

    this.api = api
    this.readOnly = readOnly

    // this.quotePlaceholder = api.i18n.t(config?.quotePlaceholder ?? Quote.DEFAULT_QUOTE_PLACEHOLDER)
    // this.captionPlaceholder = api.i18n.t(
    //   config?.captionPlaceholder ?? Quote.DEFAULT_CAPTION_PLACEHOLDER
    // )

    this.data = {
      text: data.text || '',
      caption: data.caption || '',
      alignment: Object.values(Alignment).includes(data.alignment)
        ? data.alignment
        : (config?.defaultAlignment ?? DEFAULT_ALIGNMENT)
    }
    this.css = {
      baseClass: this.api.styles.block,
      wrapper: 'cdx-quote',
      text: 'cdx-quote__text',
      input: this.api.styles.input
    }
  }

  /**
   * Notify core that read-only mode is supported
   * @returns true
   */
  public static get isReadOnlySupported(): boolean {
    return true
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   * @returns icon and title of the toolbox
   */
  public static get toolbox(): {
    /**
     * Tool icon's SVG
     */
    icon: string
    /**
     * title to show in toolbox
     */
    title: 'Quote'
  } {
    return {
      icon: IconQuote,
      title: 'Quote'
    }
  }

  /**
   * Empty Quote is not empty Block
   * @returns true
   */
  public static get contentless(): boolean {
    return true
  }

  /**
   * Allow to press Enter inside the Quote
   * @returns true
   */
  public static get enableLineBreaks(): boolean {
    return true
  }

  /**
   * Default quote alignment
   * @returns Alignment.Left
   */
  public static get DEFAULT_ALIGNMENT(): Alignment {
    return Alignment.Left
  }

  /**
   * Allow Quote to be converted to/from other blocks
   * @returns conversion config object
   */
  public static get conversionConfig(): ConversionConfig {
    return {
      /**
       * To create Quote data from string, simple fill 'text' property
       */
      import: 'text',
      /**
       * To create string from Quote data, concatenate text and caption
       * @param quoteData - Quote data object
       * @returns string
       */
      export: function (quoteData: QuoteData): string {
        return quoteData.caption ? `${quoteData.text} — ${quoteData.caption}` : quoteData.text
      }
    }
  }

  /**
   * Create Quote Tool container with inputs
   * @returns blockquote DOM element - Quote Tool container
   */
  public render(): HTMLElement {
    const container = make('blockquote')
    const quote = make('div', [], {
      contentEditable: !this.readOnly,
      innerText: this.data.text
    })

    container.appendChild(quote)

    return container
  }

  /**
   * Extract Quote data from Quote Tool element
   * @param quoteElement - Quote DOM element to save
   * @returns Quote data object
   */
  public save(quoteElement: HTMLDivElement): QuoteData {
    const text = quoteElement.querySelector(`.${this.css.text}`)

    return Object.assign(this.data, {
      text: text?.innerHTML ?? ''
    })
  }

  /**
   * Sanitizer rules
   * @returns sanitizer rules
   */
  public static get sanitize(): SanitizerConfig {
    return {
      text: {
        br: true
      }
    }
  }
}
