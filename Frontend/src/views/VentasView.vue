<script setup>
import { ref } from 'vue';

// Estados iniciales simulados para visualizar la maqueta de caja
const carrito = ref([
  { id_producto: 1, nombre: "Coca Cola 1.5L", cantidad: 2, precio: 1500, subtotal: 3000 },
  { id_producto: 2, nombre: "Platano 5k", cantidad: 1, precio: 1250, subtotal: 1250 }
]);

const metodoPago = ref('Efectivo');
const totalCaja = ref(4250);
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full items-start animate-fade-in">
    
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-base font-black text-[#0B192C]">🛒 Productos en la Venta Actual</h3>
          <span class="text-xs bg-cyan-50 text-[#00D2C4] font-bold px-3 py-1 rounded-full">
            {{ carrito.length }} Artículos
          </span>
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
                    <button class="text-gray-400 hover:text-gray-600">➖</button>
                    <span class="font-bold text-xs px-1">{{ item.cantidad }}</span>
                    <button class="text-gray-400 hover:text-gray-600">➕</button>
                  </div>
                </td>
                <td class="p-4 text-right text-gray-500">${{ item.precio.toLocaleString('es-CL') }}</td>
                <td class="p-4 text-right font-bold text-[#0B192C]">${{ item.subtotal.toLocaleString('es-CL') }}</td>
                <td class="p-4 text-center">
                  <button class="text-gray-300 hover:text-red-500 transition-colors">❌</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
        <h3 class="text-base font-black text-[#0B192C] mb-6">💰 Consolidar Transacción</h3>
        
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

        <div class="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div class="flex justify-between text-xs font-semibold text-gray-400">
            <span>Neto afecto</span>
            <span>$3.571</span>
          </div>
          <div class="flex justify-between text-xs font-semibold text-gray-400">
            <span>IVA (19%)</span>
            <span>$679</span>
          </div>
          <div class="h-px bg-gray-200 my-2"></div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-black text-[#0B192C]">Total a Pagar</span>
            <span class="text-2xl font-black text-[#0B192C]">${{ totalCaja.toLocaleString('es-CL') }}</span>
          </div>
        </div>

        <button class="w-full bg-[#0B192C] text-white hover:bg-blue-950 font-bold py-4 rounded-xl transition-all text-sm active:scale-95 shadow-md shadow-blue-950/10">
          🚀 Confirmar y Cobrar Venta
        </button>
      </div>
    </div>

  </div>
</template>