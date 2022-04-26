import { useState, useCallback } from "react";
import { Tweet } from "react-twitter-widgets";
import axios from "axios";
import {
  Space,
  Input,
  InputNumber,
  Row,
  Col,
  Spin,
  notification,
  Badge,
} from "antd";
import mockData from "./mockData.json";
import dayjs from "dayjs";
import _ from "lodash";

console.info(
  dayjs("2022/04/22/23:30").isValid(),
  dayjs("2022/04/22/23:30").format("YYYY/MM/DD HH:mm")
);

const sortByGuessTime = (arrays: typeof mockData.result) => {
  const sorted = _.sortBy(arrays, (item) => {
    const guessTime = item.text.split("@MoonLandingCMTY")[1];
    return dayjs(guessTime).valueOf();
  });
  return _.reverse(sorted);
};

const sortFunction = (
  item: typeof mockData.result[0],
  timeFlagValue: number
) => {
  const guessTime = item.text.split("@MoonLandingCMTY")[1];
  return dayjs(guessTime).valueOf() <= timeFlagValue;
};

const filterByGuessTime = (
  arrays: typeof mockData.result,
  timeFlag: string
) => {
  const timeFlagValue = dayjs(timeFlag).valueOf();
  const filteredArray = arrays
    .filter((item) => {
      const replayTime = item.created_at;
      const isValid = dayjs(timeFlag).isAfter(dayjs(replayTime));
      return isValid;
    })
    .filter((item) => {
      try {
        const guessTime = item.text.split("@MoonLandingCMTY")[1];
        return guessTime && dayjs(guessTime).isValid();
      } catch (e) {
        return false;
      }
    });

  const groupedObject = _.groupBy(filteredArray, "author_id");
  console.info(_.cloneDeep(groupedObject), "before");

  _.forEach(groupedObject, (arrays, key) => {
    const sorted = sortByGuessTime(arrays);
    const validItem = sorted.find((item) => {
      return sortFunction(item, timeFlagValue);
    });
    groupedObject[key] = validItem ? [validItem] : [];
  });
  console.info(groupedObject, "after");

  const flatArray = _.flatMap(groupedObject);

  const validArrays = sortByGuessTime(flatArray).filter((item) => {
    return sortFunction(item, timeFlagValue);
  });

  validArrays.sort((a, b) => {
    const guessTimeA = a.text.split("@MoonLandingCMTY")[1];
    const guessTimeB = b.text.split("@MoonLandingCMTY")[1];
    if (dayjs(guessTimeA).valueOf() === dayjs(guessTimeB).valueOf()) {
      return dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf();
    } else {
      return dayjs(guessTimeB).valueOf() - dayjs(guessTimeA).valueOf();
    }
  });
  return validArrays.slice(0, 20);
};

const query = "https://twitter.com/MoonLandingCMTY/status/1516920411207856128";

const MainComponent = () => {
  const [timeFlag, setTimeFlag] = useState();
  const [loading, setLoading] = useState<boolean>(false);
  const [sortedIds, setSorted] = useState<any[]>([]);
  const randomPick = useCallback(() => {
    if (!timeFlag) {
      notification.warning({
        message: "请输入蓝色起源官宣时间",
      });
      return;
    }
    if (loading) return;
    setLoading(true);
    setSorted([]);
    axios
      .post(`/api/all-replies?url=${query}`)
      .then((res) => {
        if (res && res.data.code === 200) {
          const result = res.data?.result;
          const allValidReplays = filterByGuessTime(result, timeFlag);
          const sortedReplayIds = allValidReplays.map((item) => {
            console.log(
              item.text,
              dayjs(item.created_at).format("YYYY/MM/DD HH:mm")
            );
            return item.id;
          });
          setSorted(sortedReplayIds);
        }
      })
      .finally(() => {
        setLoading(false);
      })
      .catch((err) => {});
  }, [loading, timeFlag]);

  const inputQuery = (e: any) => {
    setTimeFlag(e.target.value);
  };

  return (
    <div
      style={{
        padding: "0 50px",
      }}
    >
      <Space align="baseline">
        <a
          href="https://github.com/yzStrive/tw-replay-picker-sort-by-time"
          target="_blank"
          rel="noreferrer"
        >
          代码开源地址
        </a>
        <a href={query} target="_blank" rel="noreferrer">
          推特地址
        </a>
        <Input.Search
          value={timeFlag}
          placeholder="蓝色起源官宣时间: 2022/04/28 15:00"
          onChange={inputQuery}
          onSearch={randomPick}
          enterButton="点击开始抽取"
          style={{ paddingBottom: "20px", width: "400px" }}
        />
      </Space>
      {/* @ts-ignore */}
      <Spin spinning={loading}>
        <h1>中奖者名单({sortedIds.length})</h1>
        <Row gutter={20}>
          {sortedIds.map((item, index) => {
            return (
              <Col key={item.id_str}>
                {/* @ts-ignore */}
                <Spin spinning={loading}>
                  {/* @ts-ignore */}
                  <Badge count={index + 2}>
                    <Tweet
                      onLoad={() => {
                        setLoading(true);
                        setTimeout(() => {
                          setLoading(false);
                        }, 3000);
                      }}
                      tweetId={item}
                      options={{
                        align: "center",
                        theme: "dark",
                      }}
                    />
                  </Badge>
                </Spin>
              </Col>
            );
          })}
        </Row>
      </Spin>
    </div>
  );
};

export default MainComponent;
