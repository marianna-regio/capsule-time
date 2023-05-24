import { FastifyInstance } from 'fastify'
import { prisma } from './lib/prisma'
import { z } from 'zod'

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    await request.jwtVerify()
  })
  app.get('/memories', async (request) => {
    
    
    const memories = await prisma.memory.findMany({
      where: {
        userId: request.user.sub
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    return memories.map(memory => {
      return {
        id: memory.id,
        coverUrl: memory.coverUrl,
        excerpt: memory.content.substring(0, 115),
        createdAt: memory.createdAt
      }
    })
  })

  app.get('/memories/:id', async (request, reply) => {

    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)
    const memory = await prisma.memory.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if (!memory.isPublic && memory.userId != request.user.sub) {
      return reply.status(401).send()
    }

    return memory
  })


  app.post('/memories', async (request) => {
    //validando corpo
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false),
      createdAt: z.string()
    })

    //criando o objeto com os dados validados
    const { content, coverUrl, isPublic, createdAt } = bodySchema.parse(request.body)

    //criando memoria
    const memory = await prisma.memory.create({
      data: {
        content,
        coverUrl,
        isPublic,
        userId: request.user.sub,
      }
    })
    return memory
  })

  app.put('/memories/:id', async (request, reply) => {

    //validando id
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = paramsSchema.parse(request.params)

    //validando corpo da memory
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false)
    })

    const { content, coverUrl, isPublic } = bodySchema.parse(request.body)

    let memory = await prisma.memory.findFirstOrThrow({
      where: {
        id,
      }
    })

    if(memory.userId != request.user.sub) {
      return reply.status(401).send()
    }


    //atualizando
   memory = await prisma.memory.update({
      where: {
        id
      },
      data: {
        content,
        coverUrl,
        isPublic
      }
    })

    return memory

  })

  

  app.delete('/memories/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const memory = await prisma.memory.findFirstOrThrow({
      where: {
        id,
      }
    })

    if(memory.userId != request.user.sub) {
      return reply.status(401).send()
    }

  await prisma.memory.delete({
      where: {
        id,
      }
    })

  })

}