const http = require('http')
const express = require('express')
const axios = require('axios')
const uuid = require('uuid').v4
const cors = require('cors')

function isUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function isADate(date) {
  // const dateRegex = /^[0-9]{4}-[0-2]{2}-[0-3]{2}$/i;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
}

const validateBody = (body) => {
  const propiedades = []
  if (!body.titulo) {
    propiedades.push('titulo')
  }

  if (!body.fechaAlta) {
    propiedades.push('fechaAlta')
  }

  if (!body.contenido) {
    propiedades.push('contenido')
  }

  if (!body.usuarioId) {
    propiedades.push('usuarioId')
  }

  if (propiedades.length > 0) {
    return `No se han enviado los campos: ${propiedades.join(', ')}`
  }

  if (!isUUID(body.usuarioId)) {
    return 'El identificador del usuarioId no es un UUID.'
  }

  if (!isADate(body.fechaAlta)) {
    return 'El campo fecha de alta no tiene el formato correcto (yyyy-MM-dd).'
  }

  return null
}

const validatePartialBody = (body) => {
  const keys = Object.keys(body)
  const invalidKeys = []
  keys.forEach((key) => {
    if (!['titulo', 'contenido', 'fechaAlta', 'usuarioId'].includes(key)) {
      invalidKeys.push(key)
    }
  })

  if (invalidKeys.length > 0) {
    return `Se han enviado campos no permitdos: ${invalidKeys.join(', ')}`
  }

  if (body.usuarioId && !isUUID(body.usuarioId)) {
    return 'El identificador del usuarioId no es un UUID.'
  }

  if (body.fechaAlta && !isADate(body.fechaAlta)) {
    return 'El campo fecha de alta no tiene el formato correcto (yyyy-MM-dd).'
  }

  return null
}

const appExpress = express()

appExpress.use(cors())

appExpress.use((req, res, next) => {
  console.log('Pasa por aquí')
  next()
})

appExpress.use(express.json())


appExpress.get('/articulos/:id', async (req, res) => {
  const id = req.params.id

  console.log({ id })

  if (!isUUID(id)) {
    const error = {
      "error": "El identificador del artículo no es un UUID."
    }
    return res.status(400).json(error)
  }

  try {
    const resp = await axios.get('http://localhost:3000/articulos/' + id)
    const articulo = resp.data
    console.log(articulo)
    return res.status(200).json(articulo)
  } catch (err) {
    console.log({ err })
    return res.status(404).json()
  }
})

appExpress.patch('/articulos/:id', async (req, res) => {
  const id = req.params.id
  const body = req.body
  console.log({ id })

  if (!isUUID(id)) {
    const error = {
      "error": "El identificador del artículo no es un UUID."
    }
    return res.status(400).json(error)
  }

  try {
    await axios.get('http://localhost:3000/articulos/' + id)
  } catch (err) {
    return res.status(404).json()
  }

  const error = validatePartialBody(body)
  if (error) {
    return res.status(400).json({ error })
  }

  try {
    const resp = await axios.patch('http://localhost:3000/articulos/' + id, body)
    const articulo = resp.data
    return res.status(200).json(articulo)
  } catch (err) {
    return res.status(500).json()
  }

})

appExpress.get('/usuarios/:id/articulos', async (req, res) => {
  const id = req.params.id
  console.log({ id })

  if (!isUUID(id)) {
    const error = {
      "error": "El identificador del artículo no es un UUID."
    }
    return res.status(400).json(error)
  }

  try {
    await axios.get('http://localhost:3000/usuarios/' + id)
  } catch (err) {
    return res.status(404).json()
  }

  try {

    const resp = await axios.get('http://localhost:3000/articulos?usuarioId=' + id)
    const articulos = resp.data
    return res.status(200).json(articulos)
  } catch (err) {
    console.log({ err })
    return res.status(500).json()
  }
})

appExpress.post('/usuarios/:id/articulos', async (req, res) => {
  const id = req.params.id
  const body = req.body

  console.log({ id })

  if (!isUUID(id)) {
    const error = {
      "error": "El identificador del artículo no es un UUID."
    }
    return res.status(400).json(error)
  }

  console.log(body)

  try {
    await axios.get('http://localhost:3000/usuarios/' + id)
  } catch (err) {
    console.log({ err })
    return res.status(404).json()
  }

  console.log(body)

  const error = validateBody(body)
  if (error) {
    return res.status(400).json({ error })
  }

  try {
    const nuevoArticulo = {
      id: uuid(),
      titulo: body.titulo,
      contenido: body.contenido,
      fechaAlta: body.fechaAlta,
      usuarioId: body.usuarioId
    }
    const resp = await axios.post('http://localhost:3000/articulos', nuevoArticulo)
    // const articulo = resp.data
    // console.log(articulo)
    return res.status(201).json(nuevoArticulo)
  } catch (err) {
    console.log({ err })
    // return res.status(404).json()
    return res.status(500).json()
  }
})

const server = http.createServer(appExpress)

server.listen(8080, () => {
  console.log('Listening on http://localhost:8080...')
})