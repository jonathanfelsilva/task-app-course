const express = require('express')
const User = require('../models/user.js')
const auth = require('../middlewares/auth.js')
const multer = require('multer')
const sharp = require('sharp')
const sendGrid = require('../emails/account.js')

const router = new express.Router()

// Create an user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        
        const token = await user.generateAuthToken()
        sendGrid.enviarEmailBoasVindas(user.email, user.name)

        return res.status(201).send({user, token})
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Login
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()

        return res.send({ user, token })
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Logout (only current token)
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send('Logout realizado com sucesso.')
    } catch (error) {
        res.status(500).send(error)
    }
})

// Logout all (all tokens)
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send('Sucesso! Logout em todas as instâncias realizado.')
    } catch (error) {
        res.status(500).send(error)
    }
})

// Get the profile of the authenticated user
router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})

// Edit an user by ID
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidUpdate = updates.every((update) => {
        return allowedUpdates.includes(update)
    })

    if (!isValidUpdate) {
        return res.status(400).send({
            error: 'A requisição possui updates inválidos.'
        })
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()

        return res.status(200).send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
})

// Delete an user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()

        sendGrid.enviarEmailCancelamento(req.user.email, req.user.name)
        
        return res.status(200).send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }
})

// Upload avatar

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            return callback(new Error('File must be a PNG, JPEG or JPG.'))
        }

        callback(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        //req.user.avatar = req.file.buffer

        const buffer = await sharp(req.file.buffer)
            .resize({width: 250, height: 250})    
            .png()
            .toBuffer()

        req.user.avatar = buffer
        await req.user.save()

        res.send('Imagem recebida com sucesso!')
    } catch (error) {
        res.status(400).send(error)
    }
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

// Delete avatar

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined
        await req.user.save()

        res.status(200).send('Avatar deletado com sucesso.')
    } catch (error) {
        res.status(400).send(error)
    }
})

// Get avatar

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findOne({_id: req.params.id})

        if (!user || !user.avatar) {
            throw new Error('Usuário ou avatar não encontrado.')
        }

        res.set('Content-Type', 'image/png')
        res.status(200).send(user.avatar)
    } catch (error) {
        res.status(404).send(error)
    }
})

module.exports = router