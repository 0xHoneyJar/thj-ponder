import { ponder } from "@/generated";

ponder.get("/", async (c) => {
  return c.json({ 
    service: "THJ Ponder",
    status: "running"
  });
});

ponder.get("/transfers", async (c) => {
  const { Transfer } = c.db;
  const transfers = await Transfer.findMany({
    orderBy: { timestamp: "desc" },
    limit: 100,
  });
  return c.json(transfers);
});

ponder.get("/mints", async (c) => {
  const { Transfer } = c.db;
  const mints = await Transfer.findMany({
    where: { from: "0x0000000000000000000000000000000000000000" },
    orderBy: { timestamp: "desc" },
    limit: 100,
  });
  return c.json(mints);
});