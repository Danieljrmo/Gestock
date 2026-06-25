<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const props = defineProps({
  show: Boolean,
  productos: Array
});

const emit = defineEmits(['close', 'saved']);
const authStore = useAuthStore();

const errorMsg = ref('');
const successMsg = ref('');
const submitting = ref(false);

const movementForm = ref({
  id_producto: '',
  tipo_movimiento: 'Entrada', // Valor por defecto
  cantidad: '',
  motivo: '',
  id_proveedor: '' // Opcional por ahora
});

const resetForm = () => {
  movementForm.value = {
    id_producto: '',
    tipo_movimiento: 'Entrada',
    cantidad: '',
    motivo: '',
    id_proveedor: ''
  };
  errorMsg.value = '';
  successMsg.value = '';
};

const handleRegisterMovement = async () => {
  if (!movementForm.value.id_producto || !movementForm.value.cantidad) {
    errorMsg.value = 'Por favor, completa los campos obligatorios.';
    return;
  }

  try {
    submitting.value = true;
    errorMsg.value = '';
    
    const payload = {
      id_producto: parseInt(movementForm.value.id_producto),
      tipo_movimiento: movementForm.value.tipo_movimiento,
      cantidad: parseInt(movementForm.value.cantidad),
      motivo: movementForm.value.motivo.trim()
    };

    await axios.post('http://localhost:4000/api/movimientos', payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    successMsg.value = '¡Movimiento procesado y stock actualizado!';
    setTimeout(() => {
      emit('saved');
      emit('close');
      resetForm();
    }, 1500);

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
        <div>
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">Seleccionar Producto</label>
          <select 
            v-model="movementForm.id_producto" 
            required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#00D2C4] bg-gray-50 text-gray-700"
          >
            <option value="" disabled>Selecciona un artículo del catálogo...</option>
            <option v-for="prod in productos" :key="prod.id_producto" :value="prod.id_producto">
              {{ prod.nombre_producto }} (Stock actual: {{ prod.stock_actual }})
            </option>
          </select>
        </div>

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

        <div>
          <label class="block text-[11px] font-black tracking-wider uppercase text-gray-400 mb-2">Cantidad (Unidades)</label>
          <input 
            v-model="movementForm.cantidad" 
            type="number" 
            min="1" 
            required 
            placeholder="Ej: 12"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-[#00D2C4] bg-gray-50"
          />
        </div>

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