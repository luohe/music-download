const fs = require('fs');
const got = require('got');
const FileType = require('file-type');
const { promisify } = require('util');

const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const downloadM = async (mInfo) => {
  const { url, title, author } = mInfo;
  const musicStream = got.stream(url);
  const fileType = await FileType.fromStream(musicStream);
    if (fileType && fileType.ext) {
      await pipeline(
        got.stream(url),
        fs.createWriteStream(`./music/${title}-${author}.${fileType.ext}`)
    );
    return;
  }
  console.error("下载失败");
}

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
    })
    const musicUrlList = data.map(item => ({
      author: item.author,
      title: item.title,
      url: item.url,
    }))

    return musicUrlList;
  } catch (e) {
    throw Error(e);
  }
};

const grabMusic = async (name) => {
  const musicList = await ifkdyMusicList(name);
  if (musicList.length === 0) {
    console.warn(`没找到${name}`)
  };
  // todo: 优化匹配度，找到最想要的那个
  const musicInfo = musicList[0];
  downloadM(musicInfo, name);
  console.log(musicList);
};

grabMusic("像我这样的人");
