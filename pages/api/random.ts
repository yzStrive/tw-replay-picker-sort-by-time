import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import cache from "../../utils/cache";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (cache.has(id)) {
    const data = cache.get(id);
    res.status(200).json({
      code: 200,
      result: data,
    });
  }
  try {
    const data = await axios.get(
      `https://api.twitter.com/1.1/statuses/show.json?id=${id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );
    cache.set(id, data.data);

    res.status(200).json({
      code: 200,
      result: data.data,
    });
  } catch (e) {}
}
