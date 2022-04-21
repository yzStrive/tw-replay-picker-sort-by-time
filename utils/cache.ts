import LRU from "lru-cache";

const cache = new LRU({
  max: 5000,
  ttl: 60 * 1000 * 10,
});

export default cache;
