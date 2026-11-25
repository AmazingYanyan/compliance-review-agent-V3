/**
 * 材料预览模拟数据模块（OCR 材料预览原型）
 *
 * 只提供**前端预览**用的合成样例：页图 + 该页的模拟 OCR 文字。
 * - 样例按 `taskId + materialId` 索引，同一材料在不同任务下互不影响；
 * - 页码从 1 开始；本轮不含 bbox（坐标定位与高亮留到后续阶段）；
 * - 页图是内联 SVG（data URI），不依赖任何外部文件或真实证照素材，
 *   后续接入真实单图 OCR 时只需替换本模块的取值实现，页面调用方式不变。
 *
 * @module mock/previews
 */

/** 预览样例中的一页 */
export interface PreviewPage {
  /** 页码，从 1 开始 */
  pageNo: number
  /** 页图（data URI 形态的合成图） */
  image: string
  /** 该页的模拟 OCR 文字 */
  text: string
}

/** 一份材料的预览样例 */
export interface PreviewSample {
  /** 全部页面，按页码升序 */
  pages: PreviewPage[]
}

const FONT = 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
const PAGE_WIDTH = 900
const PAGE_HEIGHT = 1200

/** XML 转义 */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 按字符数粗略折行（中文等宽场景足够用） */
function wrapText(text: string, perLine: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const char of text) {
    line += char
    if (line.length >= perLine) {
      lines.push(line)
      line = ''
    }
  }
  if (line) lines.push(line)
  return lines
}

/** 页面外框与页脚 */
function frame(title: string, subtitle: string, body: string, pageNo: number, total: number): string {
  const content = [
    `<rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" fill="#fbfaf4"/>`,
    `<rect x="26" y="26" width="${PAGE_WIDTH - 52}" height="${PAGE_HEIGHT - 52}" fill="none" stroke="#dcd6c6" stroke-width="2"/>`,
    `<text x="${PAGE_WIDTH / 2}" y="108" font-size="34" text-anchor="middle" fill="#2f3a4f" font-family="${FONT}">${esc(title)}</text>`,
    `<text x="${PAGE_WIDTH / 2}" y="144" font-size="15" text-anchor="middle" fill="#8c8f94" font-family="${FONT}">${esc(subtitle)}</text>`,
    body,
    `<text x="${PAGE_WIDTH / 2}" y="${PAGE_HEIGHT - 46}" font-size="14" text-anchor="middle" fill="#9aa0a6" font-family="${FONT}">第 ${pageNo} 页 / 共 ${total} 页 · 合成样例数据</text>`
  ].join('')

  // 必须是完整的 SVG 文档（含根元素与 xmlns），否则作为 <img> 的 data URI 会解码失败
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}">${content}</svg>`
}

/** 证照类页面：标题 + 若干「标签 / 值」行 */
function buildDocumentPage(options: {
  title: string
  subtitle: string
  rows: [string, string][]
  pageNo: number
  total: number
}): string {
  const parts: string[] = []
  let y = 210

  for (const [label, value] of options.rows) {
    parts.push(
      `<text x="86" y="${y}" font-size="19" fill="#4a4f57" font-family="${FONT}">${esc(label)}</text>`
    )
    const lines = wrapText(value, 30)
    lines.forEach((line, index) => {
      parts.push(
        `<text x="290" y="${y + index * 26}" font-size="19" fill="#23272e" font-family="${FONT}">${esc(line)}</text>`
      )
    })
    y += lines.length * 26 + 22
    parts.push(`<line x1="86" y1="${y - 14}" x2="${PAGE_WIDTH - 86}" y2="${y - 14}" stroke="#e6e0cf" stroke-width="1"/>`)
  }

  // 合成印章
  parts.push(
    `<g opacity="0.75" transform="translate(${PAGE_WIDTH - 250}, ${PAGE_HEIGHT - 300})">` +
      `<ellipse cx="0" cy="0" rx="118" ry="118" fill="none" stroke="#c0392b" stroke-width="6"/>` +
      `<ellipse cx="0" cy="0" rx="98" ry="98" fill="none" stroke="#c0392b" stroke-width="2"/>` +
      `<text x="0" y="-18" font-size="26" text-anchor="middle" fill="#c0392b" font-family="${FONT}">样例专用章</text>` +
      `<text x="0" y="22" font-size="19" text-anchor="middle" fill="#c0392b" font-family="${FONT}">登记机关</text>` +
      `<text x="0" y="52" font-size="16" text-anchor="middle" fill="#c0392b" font-family="${FONT}">合成演示</text>` +
      `</g>`
  )

  return frame(options.title, options.subtitle, parts.join(''), options.pageNo, options.total)
}

/** 表格类页面：表头 + 数据行 */
function buildTablePage(options: {
  title: string
  subtitle: string
  headers: string[]
  rows: string[][]
  pageNo: number
  total: number
}): string {
  const parts: string[] = []
  const anchors: { x: number; anchor: string }[] = [
    { x: 70, anchor: 'start' },
    { x: 580, anchor: 'end' },
    { x: 760, anchor: 'end' },
    { x: 790, anchor: 'start' }
  ]

  let y = 200
  parts.push(`<rect x="60" y="${y - 30}" width="780" height="38" fill="#e8e4d4"/>`)
  options.headers.forEach((header, index) => {
    parts.push(
      `<text x="${anchors[index].x}" y="${y}" font-size="18" text-anchor="${anchors[index].anchor}" fill="#3c4249" font-family="${FONT}">${esc(header)}</text>`
    )
  })
  y += 44

  options.rows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      parts.push(`<rect x="60" y="${y - 26}" width="780" height="34" fill="#f4f2e8"/>`)
    }
    row.forEach((cell, index) => {
      parts.push(
        `<text x="${anchors[index].x}" y="${y}" font-size="17" text-anchor="${anchors[index].anchor}" fill="#23272e" font-family="${FONT}">${esc(cell)}</text>`
      )
    })
    y += 34
    parts.push(`<line x1="60" y1="${y - 26}" x2="840" y2="${y - 26}" stroke="#e6e0cf" stroke-width="1"/>`)
  })

  return frame(options.title, options.subtitle, parts.join(''), options.pageNo, options.total)
}

/** 生成 data URI */
function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** 营业执照样例数据（合成） */
const licenseRows: [string, string][] = [
  ['统一社会信用代码', '91310000MA1FL2XY7K'],
  ['名称', '华信资本管理有限公司'],
  ['类型', '有限责任公司（自然人投资或控股）'],
  ['法定代表人', '周明远'],
  ['注册资本', '人民币伍仟万元整（￥50,000,000.00）'],
  ['成立日期', '2015年06月18日'],
  ['营业期限', '2015年06月18日至2045年06月17日'],
  ['住所', '上海市浦东新区世纪大道1000号恒汇国际大厦28层'],
  [
    '经营范围',
    '企业管理咨询；投资管理；资产管理；财务咨询；商务信息咨询。（依法须经批准的项目，经相关部门批准后方可开展经营活动）'
  ],
  ['登记机关', '上海市浦东新区市场监督管理局'],
  ['发布日期', '2026年03月12日'],
  ['备注', '本证照为合成演示数据，不具有法律效力。']
]

/** 营业执照页的模拟 OCR 文字 */
const licenseText = [
  '营业执照（副本）',
  '（合成样例数据，仅供演示）',
  '',
  ...licenseRows.map(([label, value]) => `${label}    ${value}`),
  '',
  '【识别备注】',
  '本页为单页材料，整份材料共 1 页。',
  '红色印章区域未参与文字识别。',
  '识别置信度：0.98。'
].join('\n')

/** 财务报表样例：第 1 页（资产部分） */
const financialPage1 = {
  title: '资产负债表（资产部分）',
  headers: ['项目', '期末余额', '年初余额', '备注'],
  rows: [
    ['流动资产：', '', '', ''],
    ['货币资金', '128,640,520.33', '96,412,880.15', '银行存款'],
    ['应收账款', '42,180,660.00', '51,733,240.80', '账龄 1 年内'],
    ['预付款项', '3,268,410.55', '1,904,220.10', ''],
    ['存货', '8,642,330.18', '12,506,770.44', '跌价准备已计提'],
    ['其他流动资产', '3,670,589.60', '2,092,109.00', ''],
    ['流动资产合计', '186,402,510.66', '164,649,220.49', ''],
    ['非流动资产：', '', '', ''],
    ['固定资产', '92,300,000.00', '95,800,000.00', '房屋建筑物'],
    ['无形资产', '14,220,500.00', '15,880,400.00', '土地使用权'],
    ['递延所得税资产', '2,409,500.00', '1,539,600.00', ''],
    ['非流动资产合计', '108,930,000.00', '113,220,000.00', ''],
    ['资产总计', '295,332,510.66', '277,869,220.49', '']
  ]
}

/** 财务报表样例：第 2 页（负债和所有者权益部分） */
const financialPage2 = {
  title: '资产负债表（负债和所有者权益部分）',
  headers: ['项目', '期末余额', '年初余额', '备注'],
  rows: [
    ['流动负债：', '', '', ''],
    ['短期借款', '45,000,000.00', '38,000,000.00', '保证借款'],
    ['应付账款', '26,418,330.40', '24,992,110.25', ''],
    ['预收款项', '1,206,880.00', '980,400.00', ''],
    ['应交税费', '3,882,410.22', '3,144,760.18', ''],
    ['流动负债合计', '78,220,000.00', '70,220,000.00', ''],
    ['非流动负债：', '', '', ''],
    ['长期借款', '60,000,000.00', '60,000,000.00', '抵押借款'],
    ['递延收益', '2,110,000.00', '1,990,000.00', '政府补助'],
    ['负债合计', '140,330,000.00', '134,210,000.00', ''],
    ['所有者权益：', '', '', ''],
    ['实收资本', '50,000,000.00', '50,000,000.00', ''],
    ['资本公积', '30,000,000.00', '30,000,000.00', ''],
    ['盈余公积', '14,100,000.00', '12,400,000.00', ''],
    ['未分配利润', '60,902,510.66', '61,259,220.49', ''],
    ['所有者权益合计', '155,002,510.66', '153,659,220.49', ''],
    ['负债和所有者权益总计', '295,332,510.66', '287,869,220.49', '']
  ]
}

/** 财务报表样例：第 3 页（利润表） */
const financialPage3 = {
  title: '利润表',
  headers: ['项目', '本期金额', '上期金额', '备注'],
  rows: [
    ['一、营业收入', '128,640,520.33', '96,412,880.15', '主营业务'],
    ['减：营业成本', '74,220,330.80', '56,880,210.44', ''],
    ['税金及附加', '1,102,440.16', '884,320.70', ''],
    ['销售费用', '8,442,110.00', '7,330,550.25', ''],
    ['管理费用', '12,880,440.33', '11,220,660.18', ''],
    ['研发费用', '5,330,220.55', '4,110,880.00', ''],
    ['财务费用', '1,880,330.66', '2,220,440.35', ''],
    ['二、营业利润', '24,784,647.83', '13,765,818.23', ''],
    ['加：营业外收入', '220,000.00', '180,000.00', '政府补助'],
    ['减：营业外支出', '120,500.00', '96,400.00', ''],
    ['三、利润总额', '24,884,147.83', '13,849,418.23', ''],
    ['减：所得税费用', '3,726,622.17', '2,077,412.73', '25%'],
    ['四、净利润', '21,157,525.66', '11,772,005.50', '']
  ]
}

/** 表格页的模拟 OCR 文字 */
function buildTableText(page: { title: string; headers: string[]; rows: string[][] }, pageNo: number, total: number): string {
  const lines: string[] = [
    page.title,
    '（合成样例数据，仅供演示）',
    '',
    page.headers.join('    '),
    '--------------------------------------------',
    ...page.rows.map((row) => row.join('    ')),
    '',
    '【识别备注】',
    `本页为第 ${pageNo} 页 / 共 ${total} 页，已识别 ${page.rows.length} 行表格数据。`,
    '金额单位：人民币元，保留两位小数。',
    '表头已与本期报表格式核对一致。',
    '本行及以下为识别引擎附加说明，不影响表格数据。'
  ]
  return lines.join('\n')
}

const TOTAL_FINANCIAL_PAGES = 3

/** 预览样例索引：`taskId::materialId` → 样例 */
const PREVIEW_SAMPLES: Record<string, PreviewSample> = {
  // 待核对样例任务：营业执照（单页）
  'T2026001::M2026001-2': {
    pages: [
      {
        pageNo: 1,
        image: toDataUri(
          buildDocumentPage({
            title: '营业执照（副本）',
            subtitle: '（合成样例数据，仅供演示）',
            rows: licenseRows,
            pageNo: 1,
            total: 1
          })
        ),
        text: licenseText
      }
    ]
  },
  // 待核对样例任务：财务报表（多页）
  'T2026001::M2026001-3': {
    pages: [
      {
        pageNo: 1,
        image: toDataUri(
          buildTablePage({
            ...financialPage1,
            subtitle: '（合成样例数据，仅供演示）',
            pageNo: 1,
            total: TOTAL_FINANCIAL_PAGES
          })
        ),
        text: buildTableText(financialPage1, 1, TOTAL_FINANCIAL_PAGES)
      },
      {
        pageNo: 2,
        image: toDataUri(
          buildTablePage({
            ...financialPage2,
            subtitle: '（合成样例数据，仅供演示）',
            pageNo: 2,
            total: TOTAL_FINANCIAL_PAGES
          })
        ),
        text: buildTableText(financialPage2, 2, TOTAL_FINANCIAL_PAGES)
      },
      {
        pageNo: 3,
        image: toDataUri(
          buildTablePage({
            ...financialPage3,
            subtitle: '（合成样例数据，仅供演示）',
            pageNo: 3,
            total: TOTAL_FINANCIAL_PAGES
          })
        ),
        text: buildTableText(financialPage3, 3, TOTAL_FINANCIAL_PAGES)
      }
    ]
  }
}

/**
 * 取指定任务指定材料的预览样例
 *
 * @param taskId 任务 ID
 * @param materialId 材料 ID
 * @returns 样例；该材料没有挂样例时返回 undefined
 */
export function getPreviewSample(taskId: string, materialId: string): PreviewSample | undefined {
  if (!taskId || !materialId) return undefined
  return PREVIEW_SAMPLES[`${taskId}::${materialId}`]
}
