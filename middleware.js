// purpose of this is to authenticate the user login

module.exports.isAuthenticated  = (req,res,next)=>{
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }

};

module.exports.checkRole =(role) => {
    return (req, res, next) => {
        if (req.session.user && req.session.user.role ===role) {
            next();

        } else  {
            res.status(403).send('Access Denied');
        }
    };
};