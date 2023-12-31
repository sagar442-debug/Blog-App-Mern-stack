const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);
const secret = 'sagar'
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const multer = require('multer');
const Post = require('./models/Post')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs');

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'))



mongoose.connect('mongodb+srv://mern-blog:GyCD5CGiZ1orpR3L@cluster0.u9xomjk.mongodb.net/?retryWrites=true&w=majority')

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc)
    } catch (error) {
        res.status(400).json(error)
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        // logged in
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: userDoc._id,
                username,
            });
        });
    } else {
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (token) {
        jwt.verify(token, secret, {}, (err, info) => {
            if (err) throw err;
            res.json(info);
        });
    }
    else {
        console.log('no token provided')
    }
});



app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {


    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { originalname, path } = req.file;
        
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath)
        const { title, summary, content } = req.body;

        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });
        
        res.json(info);
    });
})

app.get('/post', async (req, res) => {
    const posts = await Post.find()
    .populate('author',['username'])
    .sort({createdAt:-1})
    .limit(20);
    res.json(posts);
})



app.listen(4000), () => {
    console.log('started')
};




//GyCD5CGiZ1orpR3L
// mern-blog
// mongodb+srv://mern-blog:GyCD5CGiZ1orpR3L@cluster0.u9xomjk.mongodb.net/?retryWrites=true&w=majority