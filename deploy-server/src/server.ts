import cors from "@fastify/cors"
import Fastify from "fastify"

const server = Fastify({ logger: true })

server.register(cors)

server.get("/", async (request, reply) => {
  return { message: "자동 배포 시스템이 돌아가고 있어요!" }
})

// GitHub에서 웹훅을 받을 엔드포인트
server.post("/webhook", async (request, reply) => {
  console.log("웹훅 받았어요!")
  console.log("보낸 데이터:", request.body)

  // 일단 받았다고 응답
  return { status: "received" }
})

// 서버 시작 ~
const start = async () => {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" })
    console.log("🎉 서버가 http://localhost:3000 에서 실행중!")
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
