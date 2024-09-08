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
    averageRating: bookObject.ratings[0].grade,
     
  });
  // Saving the book in the database
  book.save()
    .then(() => {res.status(201).json({message: 'Book saved successfully!'})})
    .catch(error => res.status(400).json({ error }));
};


// POST: add a rating to an existing book
exports.addBookRating = (req, res, next) => {
    const userId = req.auth.userId; 
    const { rating } = req.body;     
    const bookId = req.params.id;    

    // Check if the rating is between 0 and 5
    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Rating should be between 0 and 5.' });
    }

    // Find the book by ID
    Book.findOne({ _id: bookId })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Book not found.' });
            }

            // Check if the user has already rated the book
            const existingRating = book.ratings.find(r => r.userId === userId);
            if (existingRating) {
                return res.status(403).json({ message: 'You have already rated this book.' });
            }

            // Add the new rating
            book.ratings.push({ userId, grade: rating });

            // Calculate the new average rating
            const totalRatings = book.ratings.length;
            const sumRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
            const newAverageRating = sumRatings / totalRatings;

            // Update the book's average rating
            book.averageRating = newAverageRating;

            // Save the book with the new rating and updated average
            book.save()
                .then(() => res.status(200).json({ message: 'Rating added successfully.', averageRating: newAverageRating }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

//GET: 3 best rated books
exports.getBestBooks = (req, res, next) => {
    // Find all books and sort them by averageRating in descending order (highest first)
    Book.find()
        .sort({ averageRating: -1 })  // Sort by averageRating in descending order
        .limit(3)                      // Limit the result to the top 3 books
        .then((books) => {
            if (books.length === 0) {
                return res.status(404).json({ message: 'No books found.' });
            }
            res.status(200).json(books);  // Send the top 3 books in the response
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred while retrieving the books.' });
        });
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




