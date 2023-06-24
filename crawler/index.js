const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')

const inputPattern = '*.md'

async function combineMarkdownFiles(outputFile) {
  let filePaths = glob.sync(inputPattern)

  // Sort the file paths by their file names
  filePaths.sort((a, b) => {
    const fileNameA = path.basename(a)
    const fileNameB = path.basename(b)
    return fileNameA.localeCompare(fileNameB)
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
    'https://xueqiu.com/v4/statuses/user_timeline.json?page=1&user_id=1173786903'

  let result = await getData(url, {
    cache: true,
    axiosConfig: {
      headers: {
        Cookie: process.env.COOKIE,
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
    .filter((i) => i.title.includes('2023 年伯克希尔'))
  console.log(links)
  for (const link of links) {
    const md = await getArticleMarkdown(link.url)
    fs.writeFileSync(`build/${link.title}.md`, md)
  }
}
