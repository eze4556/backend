import express from 'express';
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';

const router = express.Router();

// Ruta para crear un nuevo producto
router.post('/create', createProduct);

// Ruta para obtener todos los productos
router.get('/', getProducts);

// Ruta para obtener un producto por ID
router.get('/:id', getProductById);

// Ruta para actualizar un producto
router.put('/:id', updateProduct);

// Ruta para eliminar un producto
router.delete('/:id', deleteProduct);

export default router;
