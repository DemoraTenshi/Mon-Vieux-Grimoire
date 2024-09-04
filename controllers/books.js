const Book = require('../models/Book');
const fs = require('fs');

//POST : add new book
exports.createBook = (req, res, next) => {
    //Store query as JSON in a variable
    const bookObject = JSON.parse(req.body.book);

    //Deleting false id sent by frontend
    delete bookObject._id;
    delete bookObject._userId;

    //Creating new book 
    const book = new Book ({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
     
  });
  // Saving the book in the database
  book.save()
    .then(() => {res.status(201).json({message: 'Book saved successfully!'})})
    .catch(error => res.status(400).json({ error }));
};


// GET: getting one specific book
exports.getOneBook = (req, res, next) => {
  Book.findOne({_id: req.params.id})
    .then((book) => {res.status(200).json(book)})
    .catch(error => res.status(404).json({ error }));
};

//PUT: existing book update
exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
    } : { ...req.body };
    
    delete bookObject._userId;
    
    Book.findOne({_id: req.params.id})
        .then((book) => {
            // updating book only if creator of the book's card
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message : '403: forbidden request' });
            } else {
                //  Separation of existing image file name
                const filename = book.imageUrl.split('/images/')[1];
                // If the image has been modified, the old one is deleted.
                req.file && fs.unlink(`images/${filename}`, (err => {
                        if (err) console.log(err);
                    })
                );
                // updating the book
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Book updated !' }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(404).json({ error }));
};



exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: '403: forbidden request' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                // Delete the image file and then delete the book from the database in the callback
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch((error) => {res.status(400).json({error: error})});
                });
            }
        })
        .catch( error => {res.status(404).json({ error })});
};


//GET: getting all books
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {res.status(200).json(books)})
    .catch((error) => {res.status(400).json({error: error})});
};