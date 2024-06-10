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
    'https://xueqiu.com/v4/statuses/user_timeline.json?page=1&user_id=1173786903'

  let result = await getData(url, {
    cache: true,
    axiosConfig: {
      headers: {
        Cookie:
          'snbim_minify=true; __utmc=1; cookiesu=151694248684190; s=cd1dgxkyve; bid=477008ecd6d265e2fe26ea8be9e22446_lqp0nc04; device_id=9a452b1190d09d7f3abda06c47cb10ff; smidV2=202403312056309e20e5d789280471097c12c48affad8f0096bd28ba463a2d0; Hm_lvt_1db88642e346389874251b5a1eded6e3=1712883217; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1712883217; remember=1; xq_is_login=1; u=3484636451; xq_a_token=56b131fc00ff955879d8026f270f7efa76c40c6f; xqat=56b131fc00ff955879d8026f270f7efa76c40c6f; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjM0ODQ2MzY0NTEsImlzcyI6InVjIiwiZXhwIjoxNzIwNjA0NjI3LCJjdG0iOjE3MTgwMTI2Mjc0NjUsImNpZCI6ImQ5ZDBuNEFadXAifQ.p67lzhq5q82MvsCHO6F2eVTgh7a6Wb3ycjY3F03pz4dPfnly0OlBBM9AF_XBtM7Ou3jEngRnVnyfc_XLGmHlxdiheGAjYZg3WOILnj2WNaTXyO4kun-OBOsdce-jzizd3NhneeG2YbkQvhzmA2EfJtWBkQdQAqXtc2K94ogamY4ibmr04JLnBym4FKHZuQNYq8ine-HJURgmlr7BCb46Waw5PCwMv8dwUK55dkAj5J6utgKubpSIElu7T6zgKrYaoY3aqGLAvZkHo2j88xHbzVQGm5U1xZ5-ej7zAIOj38_qw4pAJa5ErX0c_JKYiwPvBejqyR4ltHvKC_gUlr39-g; xq_r_token=5ccb96cbe48d9bf77f85aa6d4843dffb798f34db; .thumbcache_f24b8bbe5a5934237bbc0eda20c1b6e7=Nv+ILcs9ecCnhOQ957uIigHVE5PYYA2GQo//Gvmh8tdWA9//4KMSwligdgfoG3paUD4Ulc3aQAFBAMh39fMvAg%3D%3D; acw_tc=2760826a17180144298875931eb126b23b2c1529d39641b2a990bd83c4eb4a',
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
    .filter((i) => i.title.includes('2024年伯克希尔'))
  console.log(links)
  fs.ensureDirSync('build')
  for (const link of links) {
    const md = await getArticleMarkdown(link.url)
    fs.writeFileSync(`build/${link.title}.md`, md)
  }
}

grab()
  .then(() => {
    return combineMarkdownFiles('2024年伯克希尔股东大会.md')
  })
  .catch((e) => {
    console.log(e)
  })
