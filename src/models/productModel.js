export const createProductObject = (data) => {
    return {
      // photos: data.photos || [] 
      title: data.title || '', // Título del producto
      category: data.category || '', // Categoría del producto
      price: data.price || 0, // Precio del producto
      description: data.description || '', // Descripción del producto
      variants: data.variants || [], // Array de variantes
      stock: data.stock || 0, // Stock disponible
    //   createdAt: new Date().toISOString(), 
    };
  };
  