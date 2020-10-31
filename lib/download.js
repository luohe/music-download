const fs = require('fs');
const got = require('got');
const FileType = require('file-type');
const { promisify } = require('util');
const Bagpipe = require('bagpipe');

const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// 搜索
const ifkdyMusicList = async (name) => {
  try {
    const { body: { data } } = await got("http://music.ifkdy.com/", {
      "headers": {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        "cookie": "UM_distinctid=172bc049ae03a6-0f54702df660c9-143a6256-1aeaa0-172bc049ae1927; CNZZDATA1261550119=1761763601-1592292160-%7C1592292160"
      },
      "referrerPolicy": "no-referrer-when-downgrade",
      "body": `input=${name}&filter=name&type=netease&page=1`,
      "method": "POST",
      "mode": "cors",
      responseType: 'json'
    });
    console.log(data);
    const musicUrlList = data.map(item => ({
      author: item.author,
      title: item.title,
      url: item.url,
    }));

    return musicUrlList;
  } catch (e) {
    throw Error(e);
  }
};

// 下载
const downloadM = async (mInfo) => {
  const { url, title, author } = mInfo;
  const musicStream = got.stream(url);
  const fileType = await FileType.fromStream(musicStream);
    if (fileType && fileType.ext) {
      const buffer = got(url, { responseType: 'buffer' });
      await pipeline(
        got.stream(url),
        fs.createWriteStream(`./music/${title}-${author}.${fileType.ext}`)
      );
    return;
  }
  console.error("下载失败");
}

// 爬音乐并下载
const grabMusic = async (name) => {
  const musicList = await ifkdyMusicList(name);
  if (musicList.length === 0) {
    console.warn(`没找到${name}`);
    return;
  };
  // todo: 优化匹配度，找到最想要的那个
  const musicInfo = musicList[0];
  downloadM(musicInfo, name);
};

const musicNameList = [
  "有人", "世界这么大还是遇见你", "执着",
  "借", "不谓侠", "南风北巷",
  "一荤一素", "消愁", "理想三旬",
  "曾经的你", "牧马城市", "鬼迷心窍",
  "像我这样的人", "一如年少模样", "其实都没有",
  "不说再见", "光阴的故事", "心愿",
  "我们的时光", "活着（中文版）", "Faded",
  "毕业季", "青春遗言", "追光者",
  "夏至未至", "那些花儿", "念",
  "年少有你", "可惜没如果", "可惜",
  "匆匆那年", "最初的记忆", "青春",
  "不再见", ""
];

// 设定最大并发数为10
var bagpipe = new Bagpipe(30);

// musicNameList.map(async item => await grabMusic(item))
// grabMusic("不再见")
musicNameList.forEach((item, index) => {
  console.log(index);
  bagpipe.push(grabMusic, item);
});