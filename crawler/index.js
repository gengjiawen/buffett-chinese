require('dotenv').config()
const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')
const { getData, getArticleMarkdown } = require('crawler-toolbox')

const inputPattern = 'build/*.md'

const chineseNumberMap = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

function convertChineseNumber(str) {
  return str
    .split('')
    .map((char) => chineseNumberMap[char] || char)
    .join('')
}

async function combineMarkdownFiles(outputFile) {
  let filePaths = glob.sync(inputPattern)

  // Sort the file paths by their file names
  filePaths.sort((a, b) => {
    const fileNameA = convertChineseNumber(path.basename(a))
    const fileNameB = convertChineseNumber(path.basename(b))
    return fileNameA.localeCompare(fileNameB, 'zh-Hans-CN', { numeric: true })
  })
  console.log(filePaths)

  let combinedContent = ''

  for (const filePath of filePaths) {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    combinedContent += fileContent + '\n\n'
  }

  fs.ensureFileSync(outputFile)
  fs.writeFileSync(outputFile, combinedContent)
  console.log('All Markdown files have been combined into:', outputFile)
}

async function grab() {
  let url =
    'https://xueqiu.com/v4/statuses/user_timeline.json?page=1&user_id=1173786903&md5__1038=7qRxuDcDnD2G0%3DYDsD7mjv%2BWAN31DiIoKx'

  let result = await getData(url, {
    cache: true,
    axiosConfig: {
      headers: {
        Cookie: process.env.Cookie
      },
    },
  })
  const c = JSON.parse(result.content).statuses
  const links = c
    .map((i) => {
      return {
        title: i.title,
        url: `https://xueqiu.com${i.target}`,
      }
    })
    .filter((i) => i.title.includes('2025年伯克希尔'))
  console.log(links)
  fs.ensureDirSync('build')
  for (const link of links) {
    const md = await getArticleMarkdown(link.url)
    fs.writeFileSync(`build/${link.title}.md`, md)
  }
}

grab()
  .then(() => {
    return combineMarkdownFiles('2025年伯克希尔股东大会.md')
  })
  .catch((e) => {
    console.log(e)
  })
