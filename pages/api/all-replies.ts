import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import cache from "../../utils/cache";

const parseUrl = (url: string) => {
  const newUrl = new URL(url);
  if (newUrl.hostname !== "twitter.com") return false;
  if (!newUrl.pathname.includes("/status/")) return false;
  const path = newUrl.pathname.split("/");
  return {
    screen_name: path[1],
    id: path[3],
  };
};

const queryAllReplies = async (
  uri: string,
  datas: any[],
  next_token?: string
) => {
  try {
    const url = next_token ? `${uri}&next_token=${next_token}` : uri;
    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
    });
    const data = result.data;
    datas.push(...data.data);
    if (data.meta.next_token) {
      await queryAllReplies(uri, datas, data.meta.next_token);
    }
    return datas;
  } catch (e) {
    console.log(e, "eee");
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const limit = 100;
  const { url } = req.query;
  const parse = parseUrl(url as string);

  if (!parse) {
    return res.status(400).json({
      code: 400,
      error: "Invalid URL",
    });
  }
  const uri = `https://api.twitter.com/2/tweets/search/recent?query=(to:${parse.screen_name}) conversation_id:${parse.id}&max_results=${limit}&tweet.fields=author_id,created_at,entities,geo,in_reply_to_user_id,lang,possibly_sensitive,referenced_tweets,source,public_metrics`;

  if (cache.has(url)) {
    const data = cache.get(url);
    res.status(200).json({
      code: 200,
      result: data,
    });
  }
  try {
    const data = await queryAllReplies(uri, []);
    cache.set(url, data);
    res.status(200).json({
      code: 200,
      result: data,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      error: (e as any).message,
    });
  }
}
