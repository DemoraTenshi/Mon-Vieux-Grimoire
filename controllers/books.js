const Book = require('../models/Book');
const fs = require('fs');

//POST : add new book
exports.createBook = (req, res, next) => {
    //Store query as JSON in a variable
    const bookObject = JSON.parse(req.body.book);

    //control if request contain file
    if (!req.file) {
        return res.status(404).json({ message: 'Missing file'})
    }else {
    //Deleting false id sent by frontend
    delete bookObject._id;
    delete bookObject._userId; 
}
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

// POST: add a rating to a existing book
exports.addBookRating = (req, res, next) => {
    const userId = req.auth.userId; // ID de l'utilisateur authentifié
    const { rating } = req.body;     // Note envoyée dans la requête (appelée "rating" dans ton frontend)
    const bookId = req.params.id;    // ID du livre à noter

    // Vérifier que la note est bien comprise entre 0 et 5
    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
    }

    // Recherche du livre par ID
    Book.findOne({ _id: bookId })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé.' });
            }

            // Vérifier si l'utilisateur a déjà noté ce livre
            const existingRating = book.ratings.find(r => r.userId === userId);
            if (existingRating) {
                return res.status(403).json({ message: 'Vous avez déjà noté ce livre.' });
            }

            // Utiliser $push pour ajouter la nouvelle note avec le userId et la note (rating)
            Book.updateOne(
                { _id: bookId },
                { $push: { ratings: { userId, grade: rating } } } // On ajoute la note sous "grade" dans ratings
            )
                .then(() => res.status(200).json({ message: 'Note ajoutée avec succès.' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};




//GET: getting all books
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {res.status(200).json(books)})
    .catch((error) => {res.status(400).json({error: error})});
};


// GET: getting one specific book
exports.getOneBook = (req, res, next) => {
  Book.findOne({_id: req.params.id})
    .then((book) => {res.status(200).json(book)})
    .catch(error => res.status(404).json({ error }));
};

//PUT: existing book update if user is the creator
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


//DELETE : delete one book if user is the creator
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




