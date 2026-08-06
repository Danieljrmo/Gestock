<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

// ESTADOS DE PESTAÑA Y FILTROS
const pestanaActiva = ref('ventas'); // 'ventas' | 'rotacion' | 'movimientos'
const cargando = ref(false);

// Filtros de fecha
const hoy = new Date().toISOString().split('T')[0];
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const fechaInicio = ref(primerDiaMes);
const fechaFin = ref(hoy);

// DATOS REPORTE DE VENTAS
const resumenVentas = ref({
  metricas: { totalVendido: 0, netoAfecto: 0, ivaTotal: 0, totalTransacciones: 0 },
  ventas: []
});

// DATOS ROTACIÓN
const datosRotacion = ref({ masVendidos: [], menosVendidos: [] });

// DATOS HISTORIAL MOVIMIENTOS
const historialMovimientos = ref([]);

// Exportación limpia a PDF usando la ventana de impresión nativa del sistema
const exportarPDF = () => {
  window.print();
};

// OBTENER REPORTE DE VENTAS
const cargarReporteVentas = async () => {
  try {
    cargando.value = true;
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:4000/api/reportes/periodo', {
      params: { fechaInicio: fechaInicio.value, fechaFin: fechaFin.value },
      headers: { Authorization: `Bearer ${token}` }
    });
    resumenVentas.value = res.data;
  } catch (err) {
    console.error('Error reportes ventas:', err);
  } finally {
    cargando.value = false;
  }
};

// OBTENER ROTACIÓN
const cargarRotacion = async () => {
  try {
    cargando.value = true;
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:4000/api/reportes/rotacion', {
      headers: { Authorization: `Bearer ${token}` }
    });
    datosRotacion.value = res.data;
  } catch (err) {
    console.error('Error rotación:', err);
  } finally {
    cargando.value = false;
  }
};

// OBTENER HISTORIAL
const cargarHistorial = async () => {
  try {
    cargando.value = true;
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:4000/api/reportes/movimientos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    historialMovimientos.value = res.data;
  } catch (err) {
    console.error('Error historial:', err);
  } finally {
    cargando.value = false;
  }
};

// CAMBIO DE PESTAÑAS
const cambiarPestana = (pestana) => {
  pestanaActiva.value = pestana;
  if (pestana === 'ventas') cargarReporteVentas();
  if (pestana === 'rotacion') cargarRotacion();
  if (pestana === 'movimientos') cargarHistorial();
};

// --- FUNCIONES DE EXPORTACIÓN A EXCEL (CSV) ---

// Helper genérico para generar y descargar el archivo en el cliente
const descargarArchivo = (contenido, nombreArchivo) => {
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' }); // \uFEFF incluye el BOM UTF-8 para Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 1. Exportar Ventas por Período
const exportarVentasExcel = () => {
  if (!resumenVentas.value.ventas || !resumenVentas.value.ventas.length) return;
  
  let csv = 'ID Venta;Fecha y Hora;Cajero;Metodo Pago;Monto Total\n';
  
  resumenVentas.value.ventas.forEach(v => {
    const fecha = new Date(v.fecha_venta).toLocaleString('es-CL');
    const cajero = v.usuarios?.nombre_usuario || 'Admin';
    csv += `"${v.id_venta}";"${fecha}";"${cajero}";"${v.metodo_pago}";"${v.total}"\n`;
  });

  descargarArchivo(csv, `Gestock_Reporte_Ventas_${fechaInicio.value}_al_${fechaFin.value}.csv`);
};

// 2. Exportar Rotación de Productos (Alta / Baja)
const exportarRotacionExcel = () => {
  let csv = 'CATEGORIA_ROTACION;PRODUCTO;UNIDADES_VENDIDAS;RECAUDADO_STOCK\n';

  if (datosRotacion.value.masVendidos) {
    datosRotacion.value.masVendidos.forEach(p => {
      csv += `"ALTA ROTACION";"${p.nombre_producto}";"${p.unidades_vendidas}";"$${p.total_recaudado}"\n`;
    });
  }

  if (datosRotacion.value.menosVendidos) {
    datosRotacion.value.menosVendidos.forEach(p => {
      csv += `"BAJA ROTACION";"${p.nombre_producto}";"${p.unidades_vendidas} (Stock: ${p.stock_actual})";"N/A"\n`;
    });
  }

  descargarArchivo(csv, `Gestock_Rotacion_Productos_${hoy}.csv`);
};

// 3. Exportar Bitácora de Movimientos
const exportarMovimientosExcel = () => {
  if (!historialMovimientos.value || !historialMovimientos.value.length) return;

  let csv = 'FECHA;PRODUCTO;TIPO_MOVIMIENTO;CANTIDAD;MOTIVO;USUARIO_RESPONSABLE\n';

  historialMovimientos.value.forEach(m => {
    const fecha = new Date(m.fecha_movimiento).toLocaleString('es-CL');
    const prod = m.productos?.nombre_producto || 'N/A';
    const usuario = m.usuarios?.nombre_usuario || 'Sistema';
    csv += `"${fecha}";"${prod}";"${m.tipo_movimiento}";"${m.cantidad}";"${m.motivo || 'N/A'}";"${usuario}"\n`;
  });

  descargarArchivo(csv, `Gestock_Bitacora_Movimientos_${hoy}.csv`);
};

onMounted(() => {
  cargarReporteVentas();
});
</script>

<template>

  <div class="space-y-6 animate-fade-in">
    
    <!-- HEADER Y PESTAÑAS DE NAVEGACIÓN -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap justify-between items-center gap-4">
      <div>
        <h2 class="text-xl font-black text-[#0B192C]">Business Intelligence & Reportes</h2>
        <p class="text-xs text-gray-400 font-medium">Rotacion de stock y análisis transaccional para toma de decisiones.</p>
      </div>

      <!-- BOTONES DE PESTAÑAS -->
      <div class="flex gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
        <button 
          @click="cambiarPestana('ventas')"
          :class="pestanaActiva === 'ventas' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-gray-500 hover:text-gray-800'"
          class="px-4 py-2 rounded-[#00D2C4] rounded-lg transition-all"
        >
          📈 Ventas por Período
        </button>
        <button 
          @click="cambiarPestana('rotacion')"
          :class="pestanaActiva === 'rotacion' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-gray-500 hover:text-gray-800'"
          class="px-4 py-2 rounded-lg transition-all"
        >
           🔄 Rotación (Alta/Baja)
        </button>
        <button 
          @click="cambiarPestana('movimientos')"
          :class="pestanaActiva === 'movimientos' ? 'bg-white text-[#0B192C] shadow-sm' : 'text-gray-500 hover:text-gray-800'"
          class="px-4 py-2 rounded-lg transition-all"
        >
           🕒 Historial de Movimientos
        </button>
      </div>
    </div>

    <!-- PESTAÑA 1: VENTAS POR PERÍODO -->
    <div v-if="pestanaActiva === 'ventas'" class="space-y-6">
      
    <!-- CONTROLES DE FILTRO POR FECHA -->
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-[11px] font-black uppercase text-gray-400 mb-1">Fecha Inicio</label>
          <input v-model="fechaInicio" type="date" class="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700" />
        </div>
        <div>
          <label class="block text-[11px] font-black uppercase text-gray-400 mb-1">Fecha Fin</label>
          <input v-model="fechaFin" type="date" class="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-700" />
        </div>
        <button 
          @click="cargarReporteVentas" 
          class="bg-[#03b5a9] text-white hover:bg-cyan-600 px-6 py-2.5 rounded-xl font-bold text-xs transition-all"
        >
          🔍 Filtrar Período
        </button>   
    </div>
    
    <!-- GRUPO BOTONES DE DESCARGA (DERECHA) -->
    <div class="flex gap-2">
        <button 
            @click="exportarVentasExcel"
            :disabled="!resumenVentas.ventas.length"
            :class="!resumenVentas.ventas.length ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-sm'"
            class="px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
        >
            Exportar Excel (.csv)
        </button>
        <button 
            @click="exportarPDF"
            :disabled="!resumenVentas.ventas.length"
            :class="!resumenVentas.ventas.length ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#DC143C] hover:bg-[#B22222] text-white active:scale-95 shadow-sm'"
            class="px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
        >
            Exportar PDF
        </button>
    </div>

      <!-- CARDS KPI DE RESUMEN FINANCIERO -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-[11px] font-black uppercase text-gray-400">Total Recaudado (Bruto)</p>
          <p class="text-2xl font-black text-[#0B192C] mt-1">${{ resumenVentas.metricas.totalVendido.toLocaleString('es-CL') }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-[11px] font-black uppercase text-gray-400">Neto Afecto</p>
          <p class="text-2xl font-black text-gray-600 mt-1">${{ resumenVentas.metricas.netoAfecto.toLocaleString('es-CL') }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-[11px] font-black uppercase text-gray-400">IVA Débito (19%)</p>
          <p class="text-2xl font-black text-cyan-600 mt-1">${{ resumenVentas.metricas.ivaTotal.toLocaleString('es-CL') }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-[11px] font-black uppercase text-gray-400">N° Transacciones</p>
          <p class="text-2xl font-black text-[#0B192C] mt-1">{{ resumenVentas.metricas.totalTransacciones }} Ventas</p>
        </div>
      </div>

      <!-- TABLA DE DETALLE DE VENTAS -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="text-sm font-black text-[#0B192C] mb-4">📄 Registro Detallado de Boletas</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                <th class="p-3">ID Venta</th>
                <th class="p-3">Fecha y Hora</th>
                <th class="p-3">Cajero</th>
                <th class="p-3">Método Pago</th>
                <th class="p-3 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 font-medium text-gray-700">
              <tr v-for="v in resumenVentas.ventas" :key="v.id_venta" class="hover:bg-slate-50/50">
                <td class="p-3 font-bold text-[#0B192C]">#{{ v.id_venta }}</td>
                <td class="p-3">{{ new Date(v.fecha_venta).toLocaleString('es-CL') }}</td>
                <td class="p-3">{{ v.usuarios?.nombre_usuario || 'Admin' }}</td>
                <td class="p-3"><span class="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{{ v.metodo_pago }}</span></td>
                <td class="p-3 text-right font-black text-[#0B192C]">${{ parseFloat(v.total).toLocaleString('es-CL') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 2: ROTACIÓN DE PRODUCTOS (ALTA Y BAJA) -->
    <div v-if="pestanaActiva === 'rotacion'" class="space-y-6">
  
        <!-- BARRA DE ACCIONES Y EXPORTACIÓN -->
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
                <h3 class="text-sm font-black text-[#0B192C]">  Análisis ABC de Rotación de Inventario</h3>
                <p class="text-xs text-gray-400 font-medium">Clasificación de productos por volumen de venta y stock inmovilizado.</p>
            </div>
            <div class="flex gap-2">
                <button 
                    @click="exportarRotacionExcel"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                    Exportar Excel (.csv)
                </button>
                <button 
                    @click="exportarPDF"
                    class="bg-[#DC143C] hover:bg-[#B22222] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                    Exportar PDF
                </button>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- TOP MÁS VENDIDOS -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-sm font-black text-emerald-600 mb-4 flex items-center gap-2">
                    Top Productos de Alta Rotación (Alta Demanda)
                </h3>
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="bg-slate-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                            <th class="p-3">Producto</th>
                            <th class="p-3 text-center">Unids. Vendidas</th>
                            <th class="p-3 text-right">Recaudado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-for="p in datosRotacion.masVendidos" :key="p.id_producto" class="hover:bg-slate-50/50">
                            <td class="p-3 font-bold text-[#0B192C]">{{ p.nombre_producto }}</td>
                            <td class="p-3 text-center"><span class="bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-full">{{ p.unidades_vendidas }} unids.</span></td>
                            <td class="p-3 text-right font-bold text-[#0B192C]">${{ parseFloat(p.total_recaudado).toLocaleString('es-CL') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- TOP MENOS VENDIDOS -->
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 class="text-sm font-black text-amber-600 mb-4 flex items-center gap-2">
                    Productos de Baja Rotación (Alerta de Stock Atrapado)
                </h3>
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="bg-slate-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                            <th class="p-3">Producto</th>
                            <th class="p-3 text-center">Stock Físico</th>
                            <th class="p-3 text-right">Ventas Acumuladas</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-for="p in datosRotacion.menosVendidos" :key="p.id_producto" class="hover:bg-slate-50/50">
                            <td class="p-3 font-bold text-[#0B192C]">{{ p.nombre_producto }}</td>
                            <td class="p-3 text-center"><span class="bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full">{{ p.stock_actual }} en estante</span></td>
                            <td class="p-3 text-right font-bold text-gray-500">{{ p.unidades_vendidas }} unids.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- PESTAÑA 3: HISTORIAL DE MOVIMIENTOS -->
    <div v-if="pestanaActiva === 'movimientos'" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-sm font-black text-[#0B192C]"> Bitácora de Auditoría de Inventario</h3>
            <div class="flex gap-2">
                <button 
                    @click="exportarMovimientosExcel"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                    Exportar Excel (.csv)
                </button>
                <button 
                    @click="exportarPDF"
                    class="bg-[#DC143C] hover:bg-[#B22222] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                >
                    Exportar PDF
                </button>
            </div>
        </div>  

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-slate-50 text-gray-400 font-bold uppercase border-b border-gray-100">
                        <th class="p-3">Fecha</th>
                        <th class="p-3">Producto</th>
                        <th class="p-3">Tipo Movimiento</th>
                        <th class="p-3 text-center">Cantidad</th>
                        <th class="p-3">Motivo / Justificación</th>
                        <th class="p-3">Usuario Responsable</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 font-medium text-gray-700">
                    <tr v-for="m in historialMovimientos" :key="m.id_movimiento" class="hover:bg-slate-50/50">
                        <td class="p-3">{{ new Date(m.fecha_movimiento).toLocaleString('es-CL') }}</td>
                        <td class="p-3 font-bold text-[#0B192C]">{{ m.productos?.nombre_producto }}</td>
                        <td class="p-3">
                            <span 
                                :class="m.tipo_movimiento === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'" 
                                class="font-black px-2 py-0.5 rounded text-[10px]"
                            >
                                {{ m.tipo_movimiento }}
                            </span>
                        </td>
                        <td class="p-3 text-center font-bold">{{ m.cantidad }}</td>
                        <td class="p-3 text-gray-500">{{ m.motivo || 'N/A' }}</td>
                        <td class="p-3 font-bold">{{ m.usuarios?.nombre_usuario || 'Sistema' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    
  </div>
</template>