const PublicModel = require('../models/public');

module.exports = {

  index(req, res, next) {
    // if (!req.hasOwnProperty('user')) {
    PublicModel.splashData().then((data) => {
      res.render('splash', data);
    }).catch(res.error500);
    // } else if (['owner', 'supervisor',].indexOf(req.user.class) > -1) {
    //   res.redirect('/org');
    // } else if (req.user.class == 'support') {
    //   res.redirect('/org/clients');
    // } else if (['developer', 'primary',].indexOf(req.user.class) > -1) {
    //   res.redirect('/clients');
    // } else {
    //   // TODO: Who hits this? Seems like this would never hit
    //   res.notFound();
    // }
  },

};