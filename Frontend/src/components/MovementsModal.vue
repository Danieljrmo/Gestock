<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  show: Boolean,
  productos: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'saved']);
const authStore = useAuthStore();

const errorMsg = ref('');
const successMsg = ref('');
const submitting = ref(false);

// ESTADOS PARA BUSCADOR PREDICTIVO
const busquedaProducto = ref('');
const productoSeleccionado = ref(null);

const movementForm = ref({
  tipo_movimiento: 'Entrada',
  cantidad: '',
  motivo: '',
  id_proveedor: ''
});

// Filtro predictivo dentro del modal
const productosFiltradosModal = computed(() => {
  if (!busquedaProducto.value.trim() || productoSeleccionado.value) return [];
  const q = busquedaProducto.value.toLowerCase().trim();
  return props.productos.filter(p => 
    p.nombre_producto.toLowerCase().includes(q) ||
    (p.codigo_barra && p.codigo_barra.includes(q))
  );
});

const seleccionarProducto = (prod) => {
  productoSeleccionado.value = prod;
  busquedaProducto.value = prod.nombre_producto;
};

const limpiarSeleccionProducto = () => {
  productoSeleccionado.value = null;
  busquedaProducto.value = '';
};

const resetForm = () => {
  limpiarSeleccionProducto();
  movementForm.value = {
    tipo_movimiento: 'Entrada',
    cantidad: '',
    motivo: '',
    id_proveedor: ''
  };
  errorMsg.value = '';
  successMsg.value = '';
};

// Limpia el formulario cuando el modal abre o cierra
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

const handleRegisterMovement = async () => {
  if (!productoSeleccionado.value) {
    errorMsg.value = 'Por favor, selecciona un producto del catálogo.';
    return;
  }

  if (!movementForm.value.cantidad || parseFloat(movementForm.value.cantidad) <= 0) {
    errorMsg.value = 'Por favor, ingresa una cantidad válida mayor a cero.';
    return;
  }

  try {
    submitting.value = true;
    errorMsg.value = '';
    
    // Convertimos cantidad con parseFloat para soportar kilos fraccionados
    const payload = {
      id_producto: parseInt(productoSeleccionado.value.id_producto || productoSeleccionado.value.id),
      tipo_movimiento: movementForm.value.tipo_movimiento,
      cantidad: parseFloat(movementForm.value.cantidad),
      motivo: movementForm.value.motivo.trim() || (movementForm.value.tipo_movimiento === 'Entrada' ? 'Ingreso de Mercadería' : 'Ajuste de Merma')
    };

    await axios.post('http://localhost:4000/api/movimientos', payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    successMsg.value = '¡Movimiento procesado y stock actualizado!';
    setTimeout(() => {
      emit('saved');
      emit('close');
      resetForm();
    }, 1200);

  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    errorMsg.value = error.response?.data?.mensaje || 'Error al procesar la actualización en el servidor.';
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 relative">
      <button @click="emit('close'); resetForm()" class="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
      
      <h3 class="text-xl font-black text-[#0B192C] mb-2">🔄 Registrar Movimiento de Stock</h3>
      <p class="text-xs text-gray-400 mb-6">Actualiza las existencias físicas sumando entradas o deduciendo mermas de inventario.</p>

      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">⚠️ {{ errorMsg }}</div>
      <div v-if="successMsg" class="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-xs font-semibold rounded-xl">✅ {{ successMsg }}</div>

      <form @submit.prevent="handleRegisterMovement" class="space-y-4">
        
        <!-- BUSCADOR PREDICTIVO DE PRODUCTO -->
        <div class="relative">
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">Seleccionar Producto</label>
          <div class="relative">
            <input 
              v-model="busquedaProducto"
              :readonly="!!productoSeleccionado"
              type="text"
              placeholder="Escribe nombre o SKU para buscar..."
              class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#00D2C4] bg-gray-50 pr-20"
            />
            <button 
              v-if="productoSeleccionado" 
              @click="limpiarSeleccionProducto" 
              type="button"
              class="absolute right-3 top-2.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-bold transition-all"
            >
              Cambiar
            </button>
          </div>

          <!-- LISTA DESPLEGABLE CON RESULTADOS -->
          <div 
            v-if="productosFiltradosModal.length > 0" 
            class="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50"
          >
            <div 
              v-for="prod in productosFiltradosModal" 
              :key="prod.id_producto || prod.id"
              @click="seleccionarProducto(prod)"
              class="p-3 hover:bg-cyan-50 cursor-pointer flex justify-between items-center text-xs"
            >
              <div class="flex flex-col">
                <span class="font-bold text-[#0B192C]">{{ prod.nombre_producto }}</span>
                <span class="text-[10px] text-gray-400">SKU: {{ prod.codigo_barra || 'S/N' }}</span>
              </div>
              <span class="text-xs font-black text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                Stock: {{ prod.stock_actual }} {{ prod.unidad_medida === 'KILO' ? 'kg' : 'ud' }}
              </span>
            </div>
          </div>
        </div>

        <!-- TIPO DE OPERACIÓN -->
        <div>
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">Tipo de Operación</label>
          <div class="grid grid-cols-2 gap-3">
            <label 
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm cursor-pointer transition-all',
                movementForm.tipo_movimiento === 'Entrada' ? 'border-green-500 bg-green-50/50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              ]"
            >
              <input type="radio" v-model="movementForm.tipo_movimiento" value="Entrada" class="hidden" />
              📥 Entrada
            </label>
            <label 
              :class="[
                'flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm cursor-pointer transition-all',
                movementForm.tipo_movimiento === 'Salida' ? 'border-red-500 bg-red-50/50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              ]"
            >
              <input type="radio" v-model="movementForm.tipo_movimiento" value="Salida" class="hidden" />
              📤 Salida / Merma
            </label>
          </div>
        </div>

        <!-- CANTIDAD DINÁMICA (KILO VS UNIDAD) -->
        <div>
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">
            Cantidad {{ productoSeleccionado?.unidad_medida === 'KILO' ? '(Kilogramos)' : '(Unidades)' }}
          </label>
          <input 
            v-model="movementForm.cantidad" 
            type="number" 
            :step="productoSeleccionado?.unidad_medida === 'KILO' ? '0.001' : '1'"
            :min="productoSeleccionado?.unidad_medida === 'KILO' ? '0.001' : '1'" 
            required 
            :placeholder="productoSeleccionado?.unidad_medida === 'KILO' ? 'Ej: 1.500' : 'Ej: 12'"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#00D2C4] bg-gray-50"
          />
        </div>

        <!-- MOTIVO / JUSTIFICACIÓN -->
        <div>
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">Motivo o Justificación</label>
          <textarea 
            v-model="movementForm.motivo" 
            rows="2" 
            placeholder="Ej: Factura N°2044 o Producto roto en góndola"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#00D2C4] bg-gray-50 resize-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            @click="emit('close'); resetForm()"
            class="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            :disabled="submitting"
            class="px-5 py-2.5 rounded-xl bg-[#0B192C] text-white font-bold text-sm hover:bg-blue-950 disabled:opacity-50"
          >
            {{ submitting ? 'Procesando...' : 'Aplicar Ajuste' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>