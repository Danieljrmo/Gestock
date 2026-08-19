<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { storeToRefs } from 'pinia';
import { usePosStore } from '../stores/posStore'; // Ajusta la ruta a tu carpeta stores

const posStore = usePosStore();

// Extraemos las propiedades reactivas manteniendo su reactividad
const { carrito, metodoPago } = storeToRefs(posStore);
// Extraemos los métodos de la store
const { vaciarCarrito, guardarPersistencia } = posStore;

// --- ESTADOS REACTIVOS ---
const productosBD = ref([]);            // Catálogo real desde el Backend
const busqueda = ref('');               // Modelo para el buscador / lector barcode
//const carrito = ref([]);                // Ítems agregados a la venta actual
//const metodoPago = ref('Efectivo');     // Estado del método de pago
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

// AGREGAR AL CARRITO (SOPORTA KILOS Y UNIDADES)
const agregarAlCarrito = (producto) => {
  mensajeError.value = '';
  
  const stockDisponible = parseFloat(producto.stock_actual || 0);

  if (stockDisponible <= 0) {
    mensajeError.value = `El producto '${producto.nombre_producto}' no tiene stock disponible.`;
    return;
  }

  const existe = carrito.value.find(item => item.id_producto === producto.id_producto);
  const esPesable = producto.unidad_medida === 'KILO';

  if (existe) {
    const paso = esPesable ? 0.500 : 1;
    if (existe.cantidad + paso > existe.stock_max) {
      mensajeError.value = `Stock máximo disponible alcanzado (${existe.stock_max} ${esPesable ? 'kg' : 'unids'}).`;
      return;
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
  
  busqueda.value = '';
  
  // Guardamos la adición en LocalStorage/Store
  guardarPersistencia();
};

// Auto-agregar si el escáner detecta un código de barras exacto (Enter)
const buscarYAgregarBarcode = () => {
  if (!busqueda.value.trim()) return;
  const encontrado = productosBD.value.find(p => p.codigo_barra === busqueda.value.trim());
  if (encontrado) {
    agregarAlCarrito(encontrado);
  }
};

// INCREMENTAR CON BOTÓN (+)
const incrementarCantidad = (item) => {
  const esPesable = item.unidad_medida === 'KILO';
  const paso = esPesable ? 0.500 : 1;
  const nuevaCantidad = parseFloat((item.cantidad + paso).toFixed(3));

  if (nuevaCantidad > item.stock_max) {
    mensajeError.value = `No hay más stock disponible para ${item.nombre} (Máx: ${item.stock_max} ${esPesable ? 'kg' : 'unids'})`;
    return;
  }
  item.cantidad = nuevaCantidad;
  item.subtotal = Math.round(item.cantidad * item.precio_venta);

  guardarPersistencia();
};

// DECREMENTAR CON BOTÓN (-)
const decrementarCantidad = (item) => {
  const esPesable = item.unidad_medida === 'KILO';
  const paso = esPesable ? 0.500 : 1;
  const nuevaCantidad = parseFloat((item.cantidad - paso).toFixed(3));

  if (nuevaCantidad > 0) {
    item.cantidad = nuevaCantidad;
    item.subtotal = Math.round(item.cantidad * item.precio_venta);
    guardarPersistencia();
  } else {
    eliminarDelCarrito(item.id_producto);
  }
};

// EDICIÓN MANUAL DIRECTA DESDE EL INPUT (ej: tipear 0.750)
const actualizarCantidadDirecta = (item, event) => {
  const valorIngresado = parseFloat(event.target.value);

  if (isNaN(valorIngresado) || valorIngresado <= 0) {
    return; // Si el usuario borra o escribe 0, se ignora hasta ingresar un número válido
  }

  if (valorIngresado > item.stock_max) {
    mensajeError.value = `Supera el stock disponible para ${item.nombre} (Máx: ${item.stock_max} ${item.unidad_medida === 'KILO' ? 'kg' : 'unids'})`;
    item.cantidad = item.stock_max;
  } else {
    item.cantidad = valorIngresado;
  }

  item.subtotal = Math.round(item.cantidad * item.precio_venta);

  guardarPersistencia();
};

const eliminarDelCarrito = (id_producto) => {
  posStore.carrito = posStore.carrito.filter(item => item.id_producto !== id_producto);
  guardarPersistencia();
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
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start">
    
    <!-- COLUMNA IZQUIERDA: BUSCADOR Y CARRITO -->
    <div class="lg:col-span-2 space-y-6">
      
      <!-- BARRAS DE BÚSQUEDA -->
      <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 relative shadow-sm">
        <label class="block text-xs font-black uppercase text-slate-400 mb-2">
          Escanear Código de Barras o Buscar Producto
        </label>
        <div class="flex gap-2">
          <input 
            v-model="busqueda"
            @keyup.enter="buscarYAgregarBarcode"
            type="text" 
            placeholder="Escribe el nombre o escanea con el lector USB..."
            class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D2C4] font-medium"
          />
        </div>

        <!-- LISTA DESPLEGABLE -->
        <div v-if="productosFiltrados.length > 0" class="absolute z-10 left-6 right-6 top-24 bg-[#0D1B2E] border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800">
          <div 
            v-for="prod in productosFiltrados" 
            :key="prod.id_producto"
            @click="agregarAlCarrito(prod)"
            class="p-3 hover:bg-slate-800 cursor-pointer flex justify-between items-center transition-colors"
          >
            <div>
              <p class="font-bold text-sm text-white">{{ prod.nombre_producto }}</p>
              <p class="text-xs text-slate-400">SKU/Barra: {{ prod.codigo_barra || 'N/A' }} | Stock: {{ prod.stock_actual }} unids.</p>
            </div>
            <span class="font-black text-[#00D2C4] text-sm">${{ parseFloat(prod.precio_venta).toLocaleString('es-CL') }}</span>
          </div>
        </div>
      </div>

      <!-- MENSAJES DE ESTADO -->
      <div v-if="mensajeError" class="p-4 bg-red-950/40 border border-red-800/40 text-red-400 rounded-xl text-xs font-bold flex justify-between items-center">
        <span>⚠️ {{ mensajeError }}</span>
        <button @click="mensajeError = ''" class="text-red-400 hover:text-white">✕</button>
      </div>

      <div v-if="mensajeExito" class="p-4 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 rounded-xl text-xs font-bold flex justify-between items-center">
        <span>🎉 {{ mensajeExito }}</span>
        <button @click="mensajeExito = ''" class="text-emerald-400 hover:text-white">✕</button>
      </div>

      <!-- TABLA DEL CARRITO -->
      <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-base font-black text-white">Productos en la Venta Actual</h3>
          <div class="flex items-center gap-3">
            <span class="text-xs bg-cyan-950/50 text-[#00D2C4] font-bold px-3 py-1 rounded-full border border-cyan-800/40">
              {{ carrito.length }} Artículos
            </span>
            <button v-if="carrito.length > 0" @click="vaciarCarrito" class="text-xs text-slate-400 hover:text-red-400 font-bold underline">
              Vaciar
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-900/80 border-b border-slate-800 text-xs font-bold uppercase tracking-widest text-slate-400">
                <th class="p-4">Descripción</th>
                <th class="p-4 text-center">Cantidad</th>
                <th class="p-4 text-right">Precio</th>
                <th class="p-4 text-right">Total</th>
                <th class="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-sm font-medium text-slate-300">
              <tr v-for="item in carrito" :key="item.id_producto" class="hover:bg-slate-800/50">
                <td class="p-4 font-bold text-white">{{ item.nombre }}</td>
                <td class="p-4 text-center">
                  <div class="inline-flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                    <button @click="decrementarCantidad(item)" class="text-slate-400 hover:text-white font-black">➖</button>
                    
                    <input 
                      v-if="item.unidad_medida === 'KILO'"
                      :value="item.cantidad"
                      @input="actualizarCantidadDirecta(item, $event)"
                      type="number"
                      step="0.050"
                      min="0.001"
                      class="w-16 text-center font-black text-xs bg-slate-800 text-white border border-slate-600 rounded px-1 py-0.5 focus:outline-none focus:border-[#00D2C4]"
                    />

                    <span v-else class="font-black text-xs text-white px-1">{{ item.cantidad }}</span>

                    <span class="text-[10px] font-bold uppercase text-slate-400">
                      {{ item.unidad_medida === 'KILO' ? 'kg' : 'ud' }}
                    </span>

                    <button @click="incrementarCantidad(item)" class="text-slate-400 hover:text-white font-black">➕</button>
                  </div>
                </td>
                <td class="p-4 text-right text-slate-400">${{ item.precio_venta.toLocaleString('es-CL') }}</td>
                <td class="p-4 text-right font-bold text-[#00D2C4]">${{ item.subtotal.toLocaleString('es-CL') }}</td>
                <td class="p-4 text-center">
                  <button @click="eliminarDelCarrito(item.id_producto)" class="text-slate-500 hover:text-red-400 transition-colors">Quitar</button>
                </td>
              </tr>
              <tr v-if="carrito.length === 0">
                <td colspan="5" class="p-8 text-center text-slate-500 text-xs font-bold">
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
      <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 sticky top-6 shadow-sm">
        <h3 class="text-base font-black text-white mb-6">Consolidar Transacción</h3>
        
        <div class="mb-6">
          <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Método de Pago</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              @click="metodoPago = 'Efectivo'"
              :class="metodoPago === 'Efectivo' ? 'border-[#00D2C4] bg-cyan-950/40 text-[#00D2C4]' : 'border-slate-700 text-slate-400 hover:bg-slate-800'"
              class="p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              💵 Efectivo
            </button>
            <button 
              @click="metodoPago = 'Debito'"
              :class="metodoPago === 'Debito' ? 'border-[#00D2C4] bg-cyan-950/40 text-[#00D2C4]' : 'border-slate-700 text-slate-400 hover:bg-slate-800'"
              class="p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              💳 Débito/Transf.
            </button>
          </div>
        </div>

        <div class="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800 mb-6">
          <div class="flex justify-between text-xs font-semibold text-slate-400">
            <span>Neto afecto</span>
            <span>${{ netoAfecto.toLocaleString('es-CL') }}</span>
          </div>
          <div class="flex justify-between text-xs font-semibold text-slate-400">
            <span>IVA (19%)</span>
            <span>${{ ivacalculado.toLocaleString('es-CL') }}</span>
          </div>
          <div class="h-px bg-slate-800 my-2"></div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-black text-white">Total a Pagar</span>
            <span class="text-2xl font-black text-[#00D2C4]">${{ totalCaja.toLocaleString('es-CL') }}</span>
          </div>
        </div>

        <button 
          @click="procesarVenta"
          :disabled="carrito.length === 0 || cargandoVenta"
          :class="carrito.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-[#00D2C4] text-[#0B192C] hover:bg-[#00b8ac] active:scale-95 shadow-lg shadow-cyan-500/10'"
          class="w-full font-black py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
        >
          <span v-if="!cargandoVenta">Confirmar y Cobrar Venta</span>
          <span v-else class="animate-pulse">Procesando en BD...</span>
        </button>
      </div>
    </div>

  </div>
</template>