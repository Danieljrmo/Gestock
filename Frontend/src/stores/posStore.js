import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePosStore = defineStore('pos', () => {
  const carrito = ref(JSON.parse(localStorage.getItem('gestock_carrito') || '[]'));
  const metodoPago = ref('Efectivo');

  // Guardar automáticamente en localStorage cuando cambia
  const guardarPersistencia = () => {
    localStorage.setItem('gestock_carrito', JSON.stringify(carrito.value));
  };

  const agregarAlCarrito = (producto) => {
    const stockDisponible = parseFloat(producto.stock_actual || 0);
    if (stockDisponible <= 0) return { error: `Sin stock disponible.` };

    const existe = carrito.value.find(i => i.id_producto === producto.id_producto);
    const esPesable = producto.unidad_medida === 'KILO';

    if (existe) {
      const paso = esPesable ? 0.5 : 1;
      if (existe.cantidad + paso > existe.stock_max) {
        return { error: `Stock máximo alcanzado.` };
      }
      existe.cantidad = parseFloat((existe.cantidad + paso).toFixed(3));
      existe.subtotal = Math.round(existe.cantidad * existe.precio_venta);
    } else {
      carrito.value.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre_producto,
        precio_venta: parseFloat(producto.precio_venta),
        cantidad: 1,
        subtotal: parseFloat(producto.precio_venta),
        stock_max: stockDisponible,
        unidad_medida: producto.unidad_medida || 'UNIDAD'
      });
    }
    guardarPersistencia();
    return { exito: true };
  };

  const vaciarCarrito = () => {
    carrito.value = [];
    localStorage.removeItem('gestock_carrito');
  };

  return { carrito, metodoPago, agregarAlCarrito, vaciarCarrito, guardarPersistencia };
});

