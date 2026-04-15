const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/productController');

router.get('/',                           auth,                       controller.getAll);
router.get('/variants/all',               auth,                       controller.getAllVariants);
router.get('/:id',                        auth,                       controller.getById);
router.post('/',                          auth, requireRole('Admin'), controller.create);
router.put('/:id',                        auth, requireRole('Admin'), controller.update);
router.delete('/:id',                     auth, requireRole('Admin'), controller.remove);
router.patch('/:id/status',               auth, requireRole('Admin'), controller.toggleStatus);
router.get('/:id/variants',               auth,                       controller.getVariants);
router.post('/:id/variants',              auth, requireRole('Admin'), controller.addVariant);
router.put('/:id/variants/:vid',          auth, requireRole('Admin'), controller.updateVariant);
router.patch('/:id/variants/:vid/status', auth, requireRole('Admin'), controller.toggleVariantStatus);
router.delete('/:id/variants/:vid',       auth, requireRole('Admin'), controller.deleteVariant);
router.post('/bulk-import',               auth, requireRole('Admin'), controller.bulkImport);

module.exports = router;
