const Templates = require('../models/templates');

module.exports = {

  index(req, res) {
    Templates.findByUser(req.user.cmid)
    .then((templates) => {
      res.render('templates', {
        hub: {
          tab: 'templates',
          sel: null,
        },
        templates,
      });
    }).catch(res.error500);
  },

  new(req, res) {
    res.render('templates/create');
  },

  create(req, res) {
    const orgID = req.user.org;
    const userID = req.user.cmid;
    const title = req.body.title;
    const content = req.body.content;
    Templates.insertNew(orgID, userID, title, content)
    .then(() => {
      req.flash('success', 'Created new template.');
      res.redirect('/templates');
    }).catch(res.error500);
  },

  destroy(req, res) {
    Templates.removeOne(req.params.template)
    .then(() => {
      req.flash('success', 'Removed template.');
      res.redirect('/templates');
    }).catch(res.error500);
  },

  edit(req, res) {
    Templates.findByID(req.params.template)
    .then((template) => {
      if (template) {
        res.render('templates/edit', {
          template,
        });
      } else {
        notFound(res);
      }
    }).catch(res.error500);
  },

  update(req, res) {
    const templateId = req.params.template;
    const title = req.body.title;
    const content = req.body.content;
    Templates.editOne(templateId, title, content)
    .then(() => {
      req.flash('success', 'Template edited.');
      res.redirect('/templates');
    }).catch(res.error500);
  },

};
