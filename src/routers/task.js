const express = require('express')
const Task = require('../models/task.js')
const auth = require('../middlewares/auth.js')

const router = new express.Router()

// Create a task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    
    try {
        await task.save()
        return res.status(201).send(task)
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Get all tasks
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        return res.status(200).send(req.user.tasks)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Get a task by id
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send('Tarefa não encontrada pelo ID fornecido.')
        }
        
        return res.status(200).send(task)
    } catch (error) {
        return res.status(500).send(error)
    }
})

// Edit a task by id
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const validUpdates = ['description', 'completed']
    const isValidUpdate = updates.every((update) => {
        return validUpdates.includes(update)
    })

    if (!isValidUpdate) {
        return res.status(400).send({
            error: 'A requisição possui updates inválidos.'
        })
    }

    try {
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        })

        if (!task) {
            return res.status(404).send('Tarefa não encontrada pelo ID fornecido.')
        }

        updates.forEach((update) => task[update] = req.body[update])

        await task.save()

        return res.status(200).send(task)
    } catch (error) {
        return res.status(400).send(error)
    }
})

// Delete a task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        })
        
        if (!task) {
            return res.status(404).send('Tarefa não encontrada pelo ID fornecido.')
         }
 
        return res.status(200).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router