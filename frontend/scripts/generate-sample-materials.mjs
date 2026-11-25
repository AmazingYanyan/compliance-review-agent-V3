/**
 * 生成合成样例原件（CP8.2）
 *
 * 产出两份**纯合成**的样例文件，供核对工作台联调用：
 * - `public/samples/license-scan.png`   一张竖版扫描件样式图片（单图材料）
 * - `public/samples/charter.pdf`        三页 PDF，每页文字与页码都不同（PDF 材料）
 *
 * 生成方式：用无头 Chrome 把内联 HTML 渲染成图片 / 打印成 PDF，
 * 不依赖任何真实客户材料、外部素材库或 OCR 服务。
 *
 * 用法（在前端目录下执行）：
 *   node scripts/generate-sample-materials.mjs
 *
 * 环境要求：本机已安装 Google Chrome（脚本会自动探测常见安装路径）。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '../public/samples')
const TMP_DIR = resolve(__dirname, '../.sample-tmp')

/** 探测本机 Chrome 可执行文件 */
function findChrome() {
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ]
  const found = candidates.find((path) => existsSync(path))
  if (!found) {
    throw new Error('未找到 Chrome/Chromium，请先安装后重试')
  }
  return found
}

const CHROME = findChrome()

/** 样例字体与配色（与 mock/previews.ts 中的合成样例保持一致） */
const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'

/** 单张图片样例：一个虚构的「营业执照扫描件」 */
function buildImageHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 900px; height: 1400px; background: #efe9dc;
         font-family: ${FONT}; color: #23272e; }
  .sheet { position: relative; margin: 40px; padding: 56px 60px; height: 1320px;
           background: #fdfaf1; border: 3px solid #c0392b; border-radius: 6px; }
  .sheet::after { content: ''; position: absolute; inset: 14px; border: 1px solid #e3d9c3; }
  h1 { margin: 0 0 6px; text-align: center; font-size: 46px; letter-spacing: 12px; color: #b0322a; }
  .sub { margin: 0 0 34px; text-align: center; font-size: 19px; color: #8a8172; }
  .row { display: flex; gap: 20px; padding: 15px 0; border-bottom: 1px solid #e8e0cd; }
  .row .k { width: 210px; flex: none; font-size: 21px; color: #4a4f57; }
  .row .v { font-size: 21px; line-height: 1.5; }
  .stamp { position: absolute; right: 70px; bottom: 90px; width: 230px; height: 230px;
           border: 6px solid rgba(192,57,43,.7); border-radius: 50%;
           display: flex; flex-direction: column; align-items: center; justify-content: center;
           color: rgba(192,57,43,.78); transform: rotate(-14deg); }
  .stamp b { font-size: 26px; letter-spacing: 2px; }
  .stamp span { font-size: 17px; margin-top: 6px; }
  .foot { position: absolute; left: 60px; right: 60px; bottom: 34px;
          font-size: 17px; color: #9aa0a6; display: flex; justify-content: space-between; }
</style></head>
<body><div class="sheet">
  <h1>营业执照</h1>
  <p class="sub">（副本）· 合成样例数据，仅供演示</p>
  <div class="row"><div class="k">统一社会信用代码</div><div class="v">91310000MA1FL2XY7K</div></div>
  <div class="row"><div class="k">名称</div><div class="v">华信资本管理有限公司</div></div>
  <div class="row"><div class="k">类型</div><div class="v">有限责任公司（自然人投资或控股）</div></div>
  <div class="row"><div class="k">法定代表人</div><div class="v">周明远</div></div>
  <div class="row"><div class="k">注册资本</div><div class="v">人民币伍仟万元整</div></div>
  <div class="row"><div class="k">成立日期</div><div class="v">2015 年 06 月 18 日</div></div>
  <div class="row"><div class="k">住所</div><div class="v">上海市浦东新区世纪大道 1000 号恒汇国际大厦 28 层</div></div>
  <div class="row"><div class="k">登记机关</div><div class="v">上海市浦东新区市场监督管理局</div></div>
  <div class="stamp"><b>样例专用章</b><span>登记机关</span><span>合成演示</span></div>
  <div class="foot"><span>第 1 页 / 共 1 页</span><span>合成样例数据 · 不具有法律效力</span></div>
</div></body></html>`
}

/** PDF 样例：三页，各页标题、正文与醒目页码都不同，便于核对页序 */
function buildPdfHtml() {
  const pages = [
    {
      title: '合成样例 · 公司章程',
      heading: '第一章 总则',
      body: [
        '第一条 为规范公司行为，维护公司、股东和债权人的合法权益，依据相关法律法规，制定本章程。',
        '第二条 公司依法设立、依法独立承担民事责任。',
        '第三条 公司名称、住所、经营范围等事项以营业执照登记为准，本章程与登记不一致的，以登记为准。',
        '第四条 本章程自公司登记机关核准之日起生效。'
      ]
    },
    {
      title: '合成样例 · 公司章程',
      heading: '第二章 股东与出资',
      body: [
        '第五条 公司股东为境内自然人、法人或者其他依法设立的组织。',
        '第六条 股东以其认缴的出资额为限对公司承担责任，公司以其全部财产对公司债务承担责任。',
        '第七条 出资应当是货币、实物、知识产权、土地使用权等可以用货币估价并可依法转让的非货币财产。',
        '第八条 股东应当按期足额缴纳公司章程规定的各自所认缴的出资额。'
      ]
    },
    {
      title: '合成样例 · 公司章程',
      heading: '第三章 组织机构',
      body: [
        '第九条 股东会由全体股东组成，是公司的权力机构，依法行使职权。',
        '第十条 股东会会议由董事长召集主持。',
        '第十一条 公司设董事会，董事会成员由股东会选举产生。',
        '第十二条 本章程未尽事宜，由公司股东会另行决议并依法办理相关登记手续。'
      ]
    }
  ]

  const body = pages
    .map(
      (page, index) => `
  <section class="page">
    <h1>${page.title}</h1>
    <h2>${page.heading}</h2>
    <div class="big">第 ${index + 1} 页 / 共 ${pages.length} 页</div>
    ${page.body.map((line) => `<p>${line}</p>`).join('\n    ')}
    <footer>第 ${index + 1} 页 / 共 ${pages.length} 页 · 合成样例数据，不具有法律效力</footer>
  </section>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ${FONT}; color: #23272e; }
  .page { page-break-after: always; position: relative; height: 253mm; }
  .page:last-child { page-break-after: auto; }
  h1 { margin: 0 0 6px; text-align: center; font-size: 30px; letter-spacing: 6px; }
  h2 { margin: 0 0 18px; font-size: 22px; color: #4a4f57; }
  .big { font-size: 60px; font-weight: 700; color: #c0392b; text-align: center;
         margin: 10px 0 26px; letter-spacing: 4px; }
  p { margin: 0 0 14px; font-size: 17px; line-height: 1.9; text-indent: 2em; }
  footer { position: absolute; left: 0; right: 0; bottom: 0; text-align: center;
           font-size: 14px; color: #9aa0a6; }
</style></head>
<body>${body}
</body></html>`
}

/** 调用无头 Chrome */
function runChrome(args) {
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-sandbox', ...args], {
    stdio: ['ignore', 'ignore', 'pipe']
  })
}

function main() {
  rmSync(TMP_DIR, { recursive: true, force: true })
  mkdirSync(TMP_DIR, { recursive: true })
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const imageHtml = join(TMP_DIR, 'license-scan.html')
  const pdfHtml = join(TMP_DIR, 'charter.html')
  writeFileSync(imageHtml, buildImageHtml(), 'utf8')
  writeFileSync(pdfHtml, buildPdfHtml(), 'utf8')

  const imageOut = join(OUTPUT_DIR, 'license-scan.png')
  const pdfOut = join(OUTPUT_DIR, 'charter.pdf')

  runChrome([
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=FFFFFFFF',
    `--window-size=900,1400`,
    `--screenshot=${imageOut}`,
    `file://${imageHtml}`
  ])

  runChrome([
    '--no-pdf-header-footer',
    '--virtual-time-budget=4000',
    `--print-to-pdf=${pdfOut}`,
    `file://${pdfHtml}`
  ])

  rmSync(TMP_DIR, { recursive: true, force: true })

  console.log('样例生成完成：')
  console.log(' -', imageOut)
  console.log(' -', pdfOut)
}

main()
