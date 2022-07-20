
const Sauce = require('../models/Sauces');
const fs = require('fs');


//Affichage de toute les sauces

// @ts-ignore
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then((sauces) => res.status(200).json(sauces))
        .catch((error) => res.status(400).json({ error }));
};

//Affichage une sauce

// @ts-ignore
exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

// Création des sauces

// @ts-ignore
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    if (sauceObject.userId !== req.auth.userId) {
        return res.status(403).json("requête non authorisée");
    };
    const sauce = new Sauce ({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDislikes: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce enregistrée'}))
        .catch(error => res.status(400).json({ error }));
    };


//Modifier sauce

// @ts-ignore
exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : {...req.body};
    Sauce.updateOne({ _id: req.params.id}, {...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({ message: 'Sauce modifié'}))
        .catch(error => res.status(400).json({ error }));
}

//Suppression d'une sauce

// @ts-ignore
exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if(sauce != null) {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Sauce supprimé'}))
                    .catch(error => res.status(400).json({ error }));
                });
            }
        })
        .catch(error => res.status(500).json({ error }));
};

// affiches des likes 

// @ts-ignore
exports.sauceLiked = (req, res, next) => {
    const userId = req.body.userId;
    const like = req.body.like;
    const sauceId = req.params.id;

    Sauce.findOne({ _id: sauceId })
        .then(sauce => {
            //On crée notre objet
            const likeSauce = {
                // @ts-ignore
                usersLiked: sauce.usersLiked,
                // @ts-ignore
                usersDisliked: sauce.usersDisliked,
            }
            // Différents cas:
            switch (like) {
                case 1:  //Si on aime, on push dans le tableau usersLiked
                    likeSauce.usersLiked.push(userId);
                    break;
                case -1:  //Si on aime pas, on push dans le tableau usersDisliked
                    likeSauce.usersDisliked.push(userId);
                    break;
                case 0:  //Pour retirer le like/dislike
                    if (likeSauce.usersLiked.includes(userId)) {
                        //Quand on annule le like, on récupère l'userId
                        const index = likeSauce.usersLiked.indexOf(userId);
                        //Et on modifie dans le tableau pour le retirer
                        likeSauce.usersLiked.splice(index, 1);
                    } else {
                        //Même chose pour le dislike
                        const index = likeSauce.usersDisliked.indexOf(userId);
                        likeSauce.usersDisliked.splice(index, 1);
                    }
                    break;
            };
            // Calcul du nombre de likes / dislikes
            likeSauce.likes = likeSauce.usersLiked.length;
            console.log(likeSauce.usersLiked.length);
            likeSauce.dislikes = likeSauce.usersDisliked.length;
            console.log(likeSauce.usersDisliked.length);
            // Mise à jour des nouvelles valeurs
            Sauce.updateOne({ _id: sauceId }, likeSauce )
                .then(() => res.status(200).json({ message: 'Sauce notée !' }))
                .catch(error => res.status(400).json({ error }))  
        })
        .catch(error => res.status(500).json({ error }));
    } 