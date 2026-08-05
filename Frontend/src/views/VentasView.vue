<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

// --- ESTADOS REACTIVOS ---
const productosBD = ref([]);            // Catálogo real desde el Backend
const busqueda = ref('');               // Modelo para el buscador / lector barcode
const carrito = ref([]);                // Ítems agregados a la venta actual
const metodoPago = ref('Efectivo');     // Estado del método de pago
const cargandoVenta = ref(false);      // Loading spinner para el botón de cobro
const mensajeExito = ref('');           // Feedback de venta registrada
const mensajeError = ref('');           // Feedback de errores (ej. stock insuficiente)

// --- OBTENER CATÁLOGO REAL AL MONTAR EL COMPONENTE ---
const obtenerProductos = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:4000/api/productos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Filtramos solo productos activos
    productosBD.value = res.data.filter(p => p.estado === 'activo');
  } catch (err) {
    console.error('Error al cargar productos:', err);
    mensajeError.value = 'No se pudo cargar el catálogo de productos.';
  }
};

onMounted(() => {
  obtenerProductos();
});

// --- FILTRO DINÁMICO DE BÚSQUEDA (Nombre o Código de Barras) ---
const productosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return [];
  const query = busqueda.value.toLowerCase();
  return productosBD.value.filter(p => 
    p.nombre_producto.toLowerCase().includes(query) ||
    (p.codigo_barra && p.codigo_barra.includes(query))
  );
});

// --- ACCIONES DEL CARRITO ---
const agregarAlCarrito = (producto) => {
  mensajeError.value = '';
  
  // Validar si el producto tiene stock disponible
  if (producto.stock_actual <= 0) {
    mensajeError.value = `El producto '${producto.nombre_producto}' no tiene stock disponible.`;
    return;
  }

  const existe = carrito.value.find(item => item.id_producto === producto.id_producto);

  if (existe) {
    // Validar no exceder el stock físico de la BD
    if (existe.cantidad + 1 > producto.stock_actual) {
      mensajeError.value = `Stock máximo disponible alcanzado (${producto.stock_actual} unids).`;
      return;
    }
    existe.cantidad++;
    existe.subtotal = existe.cantidad * existe.precio_venta;
  } else {
    carrito.value.push({
      id_producto: producto.id_producto,
      nombre: producto.nombre_producto,
      precio_venta: parseFloat(producto.precio_venta),
      cantidad: 1,
      subtotal: parseFloat(producto.precio_venta),
      stock_max: producto.stock_actual
    });
  }
  
  busqueda.value = ''; // Limpiar el buscador tras agregar
};

// Auto-agregar si el escáner detecta un código de barras exacto (Enter)
const buscarYAgregarBarcode = () => {
  if (!busqueda.value.trim()) return;
  const encontrado = productosBD.value.find(p => p.codigo_barra === busqueda.value.trim());
  if (encontrado) {
    agregarAlCarrito(encontrado);
  }
};

const incrementarCantidad = (item) => {
  if (item.cantidad + 1 > item.stock_max) {
    mensajeError.value = `No hay más stock disponible para ${item.nombre}`;
    return;
  }
  item.cantidad++;
  item.subtotal = item.cantidad * item.precio_venta;
};

const decrementarCantidad = (item) => {
  if (item.cantidad > 1) {
    item.cantidad--;
    item.subtotal = item.cantidad * item.precio_venta;
  } else {
    eliminarDelCarrito(item.id_producto);
  }
};

const eliminarDelCarrito = (id_producto) => {
  carrito.value = carrito.value.filter(item => item.id_producto !== id_producto);
};

const vaciarCarrito = () => {
  carrito.value = [];
  mensajeError.value = '';
};

// --- CÁLCULOS FINANCIEROS DINÁMICOS (COMPUTED) ---
const totalCaja = computed(() => {
  return carrito.value.reduce((acc, item) => acc + item.subtotal, 0);
});

const netoAfecto = computed(() => {
  return Math.round(totalCaja.value / 1.19);
});

const ivacalculado = computed(() => {
  return totalCaja.value - netoAfecto.value;
});

// --- PROCESAR LA VENTA CON EL BACKEND (POST /api/ventas) ---
const procesarVenta = async () => {
  if (carrito.value.length === 0) return;

  try {
    cargandoVenta.value = true;
    mensajeError.value = '';
    mensajeExito.value = '';

    const token = localStorage.getItem('token');
    
    // Mapeamos al formato exacto que exige ventaControllers.js
    const payload = {
      detalles: carrito.value.map(item => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad
      })),
      metodo_pago: metodoPago.value
    };

    const res = await axios.post('http://localhost:4000/api/ventas', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Feedback y limpieza
    mensajeExito.value = `¡Venta #${res.data.detalles.id_venta} cobrada con éxito!`;
    vaciarCarrito();
    
    // Refrescamos la lista de productos para actualizar el stock local
    await obtenerProductos();

  } catch (err) {
    console.error('Error al procesar la venta:', err);
    mensajeError.value = err.response?.data?.error || 'Error al procesar la transacción.';
  } finally {
    cargandoVenta.value = false;
  }
};
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start animate-fade-in">
    
    <!-- COLUMNA IZQUIERDA: BUSCADOR Y CARRITO DE VENTAS -->
    <div class="lg:col-span-2 space-y-6">
      
      <!-- BARRAS DE BÚSQUEDA Y ESCÁNER DE CÓDIGO DE BARRAS -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
        <label class="block text-xs font-black uppercase text-gray-400 mb-2">
          Escanear Código de Barras o Buscar Producto
        </label>
        <div class="flex gap-2">
          <input 
            v-model="busqueda"
            @keyup.enter="buscarYAgregarBarcode"
            type="text" 
            placeholder="Escribe el nombre o escanea con el lector USB..."
            class="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D2C4] font-medium"
          />
        </div>

        <!-- LISTA DESPLEGABLE DE RESULTADOS DE BÚSQUEDA -->
        <div v-if="productosFiltrados.length > 0" class="absolute z-10 left-6 right-6 top-24 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-50">
          <div 
            v-for="prod in productosFiltrados" 
            :key="prod.id_producto"
            @click="agregarAlCarrito(prod)"
            class="p-3 hover:bg-cyan-50/50 cursor-pointer flex justify-between items-center transition-colors"
          >
            <div>
              <p class="font-bold text-sm text-[#0B192C]">{{ prod.nombre_producto }}</p>
              <p class="text-xs text-gray-400">SKU/Barra: {{ prod.codigo_barra || 'N/A' }} | Stock: {{ prod.stock_actual }} unids.</p>
            </div>
            <span class="font-black text-[#00D2C4] text-sm">${{ parseFloat(prod.precio_venta).toLocaleString('es-CL') }}</span>
          </div>
        </div>
      </div>

      <!-- MENSAJES DE ESTADO (ALERTAS) -->
      <div v-if="mensajeError" class="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex justify-between items-center">
        <span>⚠️ {{ mensajeError }}</span>
        <button @click="mensajeError = ''" class="text-red-400 hover:text-red-800">✕</button>
      </div>

      <div v-if="mensajeExito" class="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-bold flex justify-between items-center">
        <span>🎉 {{ mensajeExito }}</span>
        <button @click="mensajeExito = ''" class="text-emerald-400 hover:text-emerald-800">✕</button>
      </div>

      <!-- TABLA DEL CARRITO ACTUAL -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-base font-black text-[#0B192C]">Productos en la Venta Actual</h3>
          <div class="flex items-center gap-3">
            <span class="text-xs bg-cyan-50 text-[#00D2C4] font-bold px-3 py-1 rounded-full">
              {{ carrito.length }} Artículos
            </span>
            <button v-if="carrito.length > 0" @click="vaciarCarrito" class="text-xs text-gray-400 hover:text-red-500 font-bold underline">
              Vaciar
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400">
                <th class="p-4">Descripción</th>
                <th class="p-4 text-center">Cantidad</th>
                <th class="p-4 text-right">Precio</th>
                <th class="p-4 text-right">Total</th>
                <th class="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 text-sm font-medium text-gray-700">
              <tr v-for="item in carrito" :key="item.id_producto" class="hover:bg-slate-50/50">
                <td class="p-4 font-bold text-[#0B192C]">{{ item.nombre }}</td>
                <td class="p-4 text-center">
                  <div class="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <button @click="decrementarCantidad(item)" class="text-gray-400 hover:text-gray-600 font-black">➖</button>
                    <span class="font-bold text-xs px-1">{{ item.cantidad }}</span>
                    <button @click="incrementarCantidad(item)" class="text-gray-400 hover:text-gray-600 font-black">➕</button>
                  </div>
                </td>
                <td class="p-4 text-right text-gray-500">${{ item.precio_venta.toLocaleString('es-CL') }}</td>
                <td class="p-4 text-right font-bold text-[#0B192C]">${{ item.subtotal.toLocaleString('es-CL') }}</td>
                <td class="p-4 text-center">
                  <button @click="eliminarDelCarrito(item.id_producto)" class="text-gray-300 hover:text-red-500 transition-colors">Quitar</button>
                </td>
              </tr>
              <tr v-if="carrito.length === 0">
                <td colspan="5" class="p-8 text-center text-gray-400 text-xs font-bold">
                  El carrito está vacío. Agrega productos usando el buscador arriba.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- COLUMNA DERECHA: CONSOLIDAR TRANSACCIÓN -->
    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
        <h3 class="text-base font-black text-[#0B192C] mb-6">Consolidar Transacción</h3>
        
        <!-- MÉTODO DE PAGO -->
        <div class="mb-6">
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">Método de Pago</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="metodoPago = 'Efectivo'"
              :class="metodoPago === 'Efectivo' ? 'border-[#00D2C4] bg-cyan-50/20 text-[#00D2C4]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
              class="p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              💵 Efectivo
            </button>
            <button 
              @click="metodoPago = 'Debito'"
              :class="metodoPago === 'Debito' ? 'border-[#00D2C4] bg-cyan-50/20 text-[#00D2C4]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
              class="p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              💳 Débito/Transf.
            </button>
          </div>
        </div>

        <!-- CÁLCULO DE TOTALES (IVA Y NETO EN CHILE) -->
        <div class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div class="flex justify-between text-xs font-semibold text-gray-400">
            <span>Neto afecto</span>
            <span>${{ netoAfecto.toLocaleString('es-CL') }}</span>
          </div>
          <div class="flex justify-between text-xs font-semibold text-gray-400">
            <span>IVA (19%)</span>
            <span>${{ ivacalculado.toLocaleString('es-CL') }}</span>
          </div>
          <div class="h-px bg-gray-200 my-2"></div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-black text-[#0B192C]">Total a Pagar</span>
            <span class="text-2xl font-black text-[#0B192C]">${{ totalCaja.toLocaleString('es-CL') }}</span>
          </div>
        </div>

        <!-- BOTÓN DE COBRO CONECTADO A LA BD -->
        <button 
          @click="procesarVenta"
          :disabled="carrito.length === 0 || cargandoVenta"
          :class="carrito.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#0B192C] hover:bg-blue-950 active:scale-95 shadow-md shadow-blue-950/10'"
          class="w-full text-white font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
        >
          <span v-if="!cargandoVenta">Confirmar y Cobrar Venta</span>
          <span v-else class="animate-pulse">Procesando en BD...</span>
        </button>
      </div>
    </div>

  </div>
</template>