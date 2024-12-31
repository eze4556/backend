import { firestore } from '../models/firebase.js';
import { createProductObject } from '../models/productModel.js';

export const createProduct = async (req, res) => {
  console.log('createProduct: Solicitud recibida'); // Log inicial

  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body recibido:', req.body);

  try {
    // Validar que el cuerpo de la solicitud no esté vacío
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('El cuerpo de la solicitud está vacío.');
      return res.status(400).json({ error: 'El cuerpo de la solicitud está vacío.' });
    }

    const data = req.body;

    // Validar campos obligatorios
    if (!data.title || !data.price || !data.category) {
      console.error('Datos faltantes:', data);
      return res.status(400).json({
        error: 'Datos incompletos. Se requiere "title", "price" y "category".',
      });
    }

    // Crear el objeto del producto
    const product = createProductObject(data);

    console.log('Objeto del producto:', product);

    // Agregar a Firestore
    const productRef = await firestore.collection('products').add(product);

    console.log('Producto creado con ID:', productRef.id);

    return res.status(201).json({ id: productRef.id, ...product });
  } catch (error) {
    console.error('Error creando producto:', error);

    // Devolver error específico
    if (error.code) {
      return res.status(500).json({ error: `Error Firestore: ${error.message}` });
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};


// Obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const snapshot = await firestore.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return res.status(500).json({ error: 'Error obteniendo productos.' });
  }
};

// Obtener un producto por ID
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const productDoc = await firestore.collection('products').doc(id).get();

    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    return res.status(200).json({ id: productDoc.id, ...productDoc.data() });
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error);
    return res.status(500).json({ error: 'Error obteniendo producto por ID.' });
  }
};

// Actualizar un producto
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const productRef = firestore.collection('products').doc(id);
    await productRef.update(data);

    return res.status(200).json({ id, ...data });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    return res.status(500).json({ error: 'Error actualizando producto.' });
  }
};

// Eliminar un producto
export const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const productRef = firestore.collection('products').doc(id);
    await productRef.delete();

    return res.status(200).json({ message: 'Producto eliminado con éxito.' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    return res.status(500).json({ error: 'Error eliminando producto.' });
  }
};
