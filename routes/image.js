const express = require('express');
const router = express.Router();
let Image = require('../models/images');

router.get('/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).send('Image not found');
        }
        res.render('singleImage', { title: 'Single Image', image: image });
    } catch (err) {
        console.log('Error fetching image:', err);
        res.status(500).send('Error loading image: ' + err.message);
    }
});

router.put('/:id', async (req, res) => {
    try {
        console.log(req.params.id);
        console.log(req.body);
        await Image.updateOne({_id: req.params.id}, {
            $set: {
                name: req.body.name
            }
        }, {upsert: true});
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error updating image');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        console.log(req.params.id);
        await Image.deleteOne({_id: req.params.id});
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error deleting image');
    }
});

module.exports = router;
