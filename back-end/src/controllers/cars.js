import prisma from '../database/client.js'
import Car from '../../../front-end/src/validators/Car.js'
import { ZodError } from 'zod'

const carroController = {}   

/*
  Vulnerabilidade: API8:2023 - Má configuração de segurança.
  Esta vulnerabilidade foi evitada no código ao validar todos os dados de entrada
  utilizando Zod, rejeitando dados mal formatados ou inválidos
  com retorno de status 422 (Unprocessable Entity). Além disso, os IDs created_user_id 
  e updated_user_id são definidos pelo servidor baseado no token
  autenticado, evitando que o cliente defina esses valores aleatoriamente.
*/

carroController.create = async (req, res) => {
  try {
    const dadosRecebidos = req.body

    if (dadosRecebidos.selling_date) {
      dadosRecebidos.selling_date = new Date(dadosRecebidos.selling_date)
    }

    Car.parse(dadosRecebidos)

    dadosRecebidos.created_user_id = req.authUser.id
    dadosRecebidos.updated_user_id = req.authUser.id

    await prisma.car.create({ data: dadosRecebidos })

    res.status(201).end()
  }
  catch (err) {
    console.error(err)

    if (err instanceof ZodError) {
      return res.status(422).send(err.issues)
    }

    res.status(500).end()
  }
}

carroController.retrieveAll = async (req, res) => {
  try {
    const relacoes = req.query.include?.split(',') ?? []

    const carros = await prisma.car.findMany({
      orderBy: [
        { brand: 'asc' },
        { model: 'asc' },
        { id: 'asc' }
      ],
      include: {
        customer: relacoes.includes('customer'),
        created_user: relacoes.includes('created_user'),
        updated_user: relacoes.includes('updated_user')
      }
    })

    res.send(carros)
  }
  catch (err) {
    console.error(err)
    res.status(500).end()
  }
}

carroController.retrieveOne = async (req, res) => {
  try {
    const relacoes = req.query.include?.split(',') ?? []

    const carroEncontrado = await prisma.car.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        customer: relacoes.includes('customer'),
        created_user: relacoes.includes('created_user'),
        updated_user: relacoes.includes('updated_user')
      }
    })

    if (carroEncontrado) {
      res.send(carroEncontrado)
    }
    else {
      res.status(404).end()
    }
  }
  catch (err) {
    console.error(err)
    res.status(500).end()
  }
}

carroController.update = async (req, res) => {
  try {
    const dadosAtualizados = req.body

    if (dadosAtualizados.selling_date) {
      dadosAtualizados.selling_date = new Date(dadosAtualizados.selling_date)
    }

    Car.parse(dadosAtualizados)

    dadosAtualizados.updated_user_id = req.authUser.id

    await prisma.car.update({
      where: { id: Number(req.params.id) },
      data: dadosAtualizados
    })

    res.status(204).end()
  }
  catch (err) {
    console.error(err)

    if (err?.code === 'P2025') return res.status(404).end()
    if (err instanceof ZodError) return res.status(422).send(err.issues)

    res.status(500).end()
  }
}

carroController.delete = async (req, res) => {
  try {
    await prisma.car.delete({
      where: { id: Number(req.params.id) }
    })

    res.status(204).end()
  }
  catch (err) {
    if (err?.code === 'P2025') {
      res.status(404).end()
    }
    else {
      console.error(err)
      res.status(500).end()
    }
  }
}

export default carroController
const controller = carroController  
export { controller }