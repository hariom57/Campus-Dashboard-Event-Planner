const express = require('express');
const router = express.Router();
const { Club } = require('../database/schemas');
const { userLoggedIn } = require('../middlewares/userAuth');
const { checkManageClub } = require('../middlewares/permissions/manageClubs');

// Route to get all clubs
router.get('/', userLoggedIn, async (req, res) => {
    try {
        const clubs = await Club.findAll()

        return res.json({ clubs });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch clubs'
        });
    }
});

// Route to get a club using id
router.get('/:id', userLoggedIn, async (req, res) => {
    try {
        const { id } = req.params
        const club = await Club.findOne({
            where: {
                id: id
            }
        })

        return res.json({ club });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch clubs'
        });
    }
});

// Protected route to create club
router.post('/create', checkManageClub, async (req, res) => {
    const { name, email, description, logo_url } = req.body;

    try {
        const clubs = await Club.create({
            name: name,
            email: email,
            description: description,
            logo_url: logo_url
        })
        console.log(clubs)

        res.json({ clubs });
    } catch (error) {
        console.error('Error fetching club admins:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch club admins'
        });
    }
});

// Protected route to delete club
router.delete('/delete/:id', checkManageClub, async (req, res) => {
    const { id } = req.params

    try {
        const clubs = await Club.destroy({
            where: {
                id: id
            }
        })
        console.log(clubs)

        res.json({ clubs });
    } catch (error) {
        console.error('Error fetching club admins:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch club admins'
        });
    }
});

// Protected route to update club
router.patch('/update/:id', checkManageClub, async (req, res) => {
    const { id } = req.params
    const { name, email, description, logo_url } = req.body
    try {
        const clubs = await Club.update({
            name: name,
            email: email,
            description: description,
            logo_url: logo_url
        }, {
            where: {
                id: id
            }
        })
        console.log(clubs)

        res.json({ clubs });
    } catch (error) {
        console.error('Error fetching club admins:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'Could not fetch club admins'
        });
    }
});

module.exports = router;