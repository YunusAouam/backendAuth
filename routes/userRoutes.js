const { findAll,getOne, insertOne, updateClient, deleteClient,searchClients } = require("../controllers/userController");

const router = require("express").Router();

router.get('/',findAll);
router.get('/:id',getOne);
router.post('/',insertOne);
router.put('/',updateClient);
router.delete('/:id',deleteClient);
router.get('/search/:key',searchClients);


module.exports = router;
