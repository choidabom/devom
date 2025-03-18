import path from "node:path";
import express from "express";

const app = express();
const PORT = 3000;

app.get("*", (_, res) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\nDev Server running at http://localhost:${PORT}`);
});
