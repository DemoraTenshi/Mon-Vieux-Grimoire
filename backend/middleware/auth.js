const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        
        // Utilisation de la clé secrète depuis les variables d'environnement
        const secret = process.env.JWT_SECRET || 'defaultSecretKey';
        const decodedToken = jwt.verify(token, secret);
        
        const userId = decodedToken.userId;
        
        // Ajouter le userId à la requête pour l'utiliser dans les routes suivantes
        req.auth = { userId };
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Requête non authentifiée', error });
    }
};
