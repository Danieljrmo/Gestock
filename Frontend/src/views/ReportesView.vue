<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// 1. GENERACIÓN PROFESIONAL DE PDF CON TABLAS DINÁMICAS Y SOPORTE DE KILOS/UNIDADES
const exportarPDF = () => {
  const doc = new jsPDF();
  const fechaGeneracion = new Date().toLocaleDateString('es-CL');

  // Encabezado Corporativo
  doc.setFontSize(18);
  doc.setTextColor(11, 25, 44); // Color #0B192C
  doc.text('GESTOCK - Reporte de Gestión', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de emisión: ${fechaGeneracion}`, 14, 26);

  // A) SI ESTAMOS EN PESTAÑA VENTAS POR PERÍODO
  if (pestanaActiva.value === 'ventas') {
    doc.setFontSize(14);
    doc.setTextColor(3, 181, 169);
    doc.text(`Reporte de Ventas (${fechaInicio.value} al ${fechaFin.value})`, 14, 35);

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Total Recaudado: $${(resumenVentas.value.metricas.totalVendido || 0).toLocaleString('es-CL')}`, 14, 43);
    doc.text(`Neto Afecto: $${(resumenVentas.value.metricas.netoAfecto || 0).toLocaleString('es-CL')}`, 14, 49);
    doc.text(`IVA Débito (19%): $${(resumenVentas.value.metricas.ivaTotal || 0).toLocaleString('es-CL')}`, 14, 55);
    doc.text(`Transacciones Totales: ${resumenVentas.value.metricas.totalTransacciones || 0}`, 14, 61);

    const tablaFilas = (resumenVentas.value.ventas || []).map(v => [
      `#${v.id_venta}`,
      new Date(v.fecha_venta).toLocaleString('es-CL'),
      v.usuarios?.nombre_usuario || 'Admin',
      v.metodo_pago,
      `$${parseFloat(v.total).toLocaleString('es-CL')}`
    ]);

    autoTable(doc, {
      startY: 67,
      head: [['ID Venta', 'Fecha y Hora', 'Cajero', 'Método Pago', 'Monto Total']],
      body: tablaFilas,
      headStyles: { fillColor: [11, 25, 44] },
      styles: { fontSize: 8 }
    });
  } 

  // B) SI ESTAMOS EN PESTAÑA ROTACIÓN DE INVENTARIO
  else if (pestanaActiva.value === 'rotacion') {
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text('Análisis ABC - Top Productos de Alta Rotación', 14, 35);

    const masVendidosFilas = (datosRotacion.value.masVendidos || []).map(p => [
      p.nombre_producto,
      `${parseFloat(p.unidades_vendidas || 0)} ${p.unidad_medida === 'KILO' ? 'kg' : 'unids.'}`,
      `$${parseFloat(p.total_recaudado || 0).toLocaleString('es-CL')}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Producto', 'Cant. Vendida', 'Recaudado']],
      body: masVendidosFilas,
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 }
    });

    const finalY = (doc.lastAutoTable?.finalY || 100) + 12;

    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6);
    doc.text('Productos de Baja Rotación (Alerta de Stock Atrapado)', 14, finalY);

    const menosVendidosFilas = (datosRotacion.value.menosVendidos || []).map(p => [
      p.nombre_producto,
      `${parseFloat(p.stock_actual || 0)} ${p.unidad_medida === 'KILO' ? 'kg' : 'unids.'}`,
      `${parseFloat(p.unidades_vendidas || 0)} ${p.unidad_medida === 'KILO' ? 'kg' : 'unids.'}`
    ]);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Producto', 'Stock Físico', 'Ventas Acumuladas']],
      body: menosVendidosFilas,
      headStyles: { fillColor: [217, 119, 6] },
      styles: { fontSize: 8 }
    });
  }

  // C) SI ESTAMOS EN PESTAÑA HISTORIAL DE MOVIMIENTOS
  else if (pestanaActiva.value === 'movimientos') {
    doc.setFontSize(14);
    doc.setTextColor(11, 25, 44);
    doc.text('Bitácora de Auditoría de Inventario', 14, 35);

    const movimientosFilas = (historialMovimientos.value || []).map(m => [
      new Date(m.fecha_movimiento).toLocaleString('es-CL'),
      m.productos?.nombre_producto || 'N/A',
      m.tipo_movimiento,
      `${parseFloat(m.cantidad)} ${m.productos?.unidad_medida === 'KILO' ? 'kg' : 'unids.'}`,
      m.motivo || 'N/A',
      m.usuarios?.nombre_usuario || 'Sistema'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Fecha', 'Producto', 'Tipo Operación', 'Cantidad', 'Motivo', 'Responsable']],
      body: movimientosFilas,
      headStyles: { fillColor: [11, 25, 44] },
      styles: { fontSize: 8 }
    });
  }

  doc.save(`Gestock_Reporte_${pestanaActiva.value}_${fechaGeneracion.replace(/\//g, '-')}.pdf`);
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
const descargarArchivo = (contenido, nombreArchivo) => {
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
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

// 2. Exportar Rotación de Productos (Alta / Baja) - 👈 Actualizado con unidades/kg
const exportarRotacionExcel = () => {
  let csv = 'CATEGORIA_ROTACION;PRODUCTO;CANTIDAD_VENDIDA;RECAUDADO_STOCK\n';

  if (datosRotacion.value.masVendidos) {
    datosRotacion.value.masVendidos.forEach(p => {
      const um = p.unidad_medida === 'KILO' ? 'kg' : 'unids.';
      csv += `"ALTA ROTACION";"${p.nombre_producto}";"${parseFloat(p.unidades_vendidas || 0)} ${um}";"$${p.total_recaudado}"\n`;
    });
  }

  if (datosRotacion.value.menosVendidos) {
    datosRotacion.value.menosVendidos.forEach(p => {
      const um = p.unidad_medida === 'KILO' ? 'kg' : 'unids.';
      csv += `"BAJA ROTACION";"${p.nombre_producto}";"${parseFloat(p.unidades_vendidas || 0)} ${um} (Stock: ${p.stock_actual} ${um})";"N/A"\n`;
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
    const um = m.productos?.unidad_medida === 'KILO' ? 'kg' : 'unids.';
    const usuario = m.usuarios?.nombre_usuario || 'Sistema';
    csv += `"${fecha}";"${prod}";"${m.tipo_movimiento}";"${parseFloat(m.cantidad)} ${um}";"${m.motivo || 'N/A'}";"${usuario}"\n`;
  });

  descargarArchivo(csv, `Gestock_Bitacora_Movimientos_${hoy}.csv`);
};

onMounted(() => {
  cargarReporteVentas();
});
</script>

<template>
  <div class="space-y-6">
    
    <!-- HEADER Y PESTAÑAS DE NAVEGACIÓN -->
    <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center gap-4">
      <div>
        <h2 class="text-xl font-black text-white">Business Intelligence & Reportes</h2>
        <p class="text-xs text-slate-400 font-medium">Rotación de stock y análisis transaccional para toma de decisiones.</p>
      </div>

      <!-- BOTONES DE PESTAÑAS -->
      <div class="flex gap-2 bg-slate-900 p-1.5 rounded-xl text-xs font-bold border border-slate-800">
        <button 
          @click="cambiarPestana('ventas')"
          :class="pestanaActiva === 'ventas' ? 'bg-[#00D2C4] text-[#0B192C] shadow-sm' : 'text-slate-400 hover:text-white'"
          class="px-4 py-2 rounded-lg transition-all"
        >
          📈 Ventas por Período
        </button>
        <button 
          @click="cambiarPestana('rotacion')"
          :class="pestanaActiva === 'rotacion' ? 'bg-[#00D2C4] text-[#0B192C] shadow-sm' : 'text-slate-400 hover:text-white'"
          class="px-4 py-2 rounded-lg transition-all"
        >
           🔄 Rotación (Alta/Baja)
        </button>
        <button 
          @click="cambiarPestana('movimientos')"
          :class="pestanaActiva === 'movimientos' ? 'bg-[#00D2C4] text-[#0B192C] shadow-sm' : 'text-slate-400 hover:text-white'"
          class="px-4 py-2 rounded-lg transition-all"
        >
           🕒 Historial de Movimientos
        </button>
      </div>
    </div>

    <!-- PESTAÑA 1: VENTAS POR PERÍODO -->
    <div v-if="pestanaActiva === 'ventas'" class="space-y-6">

      <!-- CONTROLES DE FILTRO -->
      <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="block text-[11px] font-black uppercase text-slate-400 mb-1">Fecha Inicio</label>
            <input 
              v-model="fechaInicio" 
              type="date" 
              class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00D2C4]" 
            />
          </div>

          <div>
            <label class="block text-[11px] font-black uppercase text-slate-400 mb-1">Fecha Fin</label>
            <input 
              v-model="fechaFin" 
              type="date" 
              class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00D2C4]" 
            />
          </div> 

          <button 
            @click="cargarReporteVentas" 
            class="bg-[#00D2C4] text-[#0B192C] hover:bg-[#00b8ac] px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-xs"
          >
            🔍 Filtrar Período
          </button> 
        </div>
    
        <div class="flex items-center gap-2">
          <button 
            @click="exportarVentasExcel"
            :disabled="!resumenVentas.ventas.length"
            :class="!resumenVentas.ventas.length ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-sm'"
            class="px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
          >
            Exportar Excel (.csv)
          </button>

          <button 
            @click="exportarPDF"
            :disabled="!resumenVentas.ventas.length"
            :class="!resumenVentas.ventas.length ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-[#DC143C] hover:bg-[#B22222] text-white active:scale-95 shadow-sm'"
            class="px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      <!-- CARDS KPI DE RESUMEN FINANCIERO -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#0D1B2E] p-5 rounded-2xl border border-slate-800">
          <p class="text-[11px] font-black uppercase text-slate-400">Total Recaudado (Bruto)</p>
          <p class="text-2xl font-black text-white mt-1">${{ resumenVentas.metricas.totalVendido.toLocaleString('es-CL') }}</p>
        </div>
        <div class="bg-[#0D1B2E] p-5 rounded-2xl border border-slate-800">
          <p class="text-[11px] font-black uppercase text-slate-400">Neto Afecto</p>
          <p class="text-2xl font-black text-slate-300 mt-1">${{ resumenVentas.metricas.netoAfecto.toLocaleString('es-CL') }}</p>
        </div>
        <div class="bg-[#0D1B2E] p-5 rounded-2xl border border-slate-800">
          <p class="text-[11px] font-black uppercase text-slate-400">IVA Débito (19%)</p>
          <p class="text-2xl font-black text-[#00D2C4] mt-1">${{ resumenVentas.metricas.ivaTotal.toLocaleString('es-CL') }}</p>
        </div>
        <div class="bg-[#0D1B2E] p-5 rounded-2xl border border-slate-800">
          <p class="text-[11px] font-black uppercase text-slate-400">N° Transacciones</p>
          <p class="text-2xl font-black text-white mt-1">{{ resumenVentas.metricas.totalTransacciones }} Ventas</p>
        </div>
      </div>

      <!-- TABLA DETALLE DE VENTAS -->
      <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800">
        <h3 class="text-sm font-black text-white mb-4">Registro Detallado de Boletas</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-900/80 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th class="p-3">ID Venta</th>
                <th class="p-3">Fecha y Hora</th>
                <th class="p-3">Cajero</th>
                <th class="p-3">Método Pago</th>
                <th class="p-3 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 font-medium text-slate-300">
              <tr v-for="v in resumenVentas.ventas" :key="v.id_venta" class="hover:bg-slate-800/50">
                <td class="p-3 font-bold text-white">#{{ v.id_venta }}</td>
                <td class="p-3">{{ new Date(v.fecha_venta).toLocaleString('es-CL') }}</td>
                <td class="p-3">{{ v.usuarios?.nombre_usuario || 'Admin' }}</td>
                <td class="p-3"><span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-700">{{ v.metodo_pago }}</span></td>
                <td class="p-3 text-right font-black text-[#00D2C4]">${{ parseFloat(v.total).toLocaleString('es-CL') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 2: ROTACIÓN DE PRODUCTOS -->
    <div v-if="pestanaActiva === 'rotacion'" class="space-y-6">
      <div class="bg-[#0D1B2E] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
        <div>
          <h3 class="text-sm font-black text-white">Análisis ABC de Rotación de Inventario</h3>
          <p class="text-xs text-slate-400 font-medium">Clasificación de productos por volumen de venta y stock inmovilizado.</p>
        </div>
        <div class="flex gap-2">
          <button @click="exportarRotacionExcel" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
            Exportar Excel (.csv)
          </button>
          <button @click="exportarPDF" class="bg-[#DC143C] hover:bg-[#B22222] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
            Exportar PDF
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- TOP MÁS VENDIDOS -->
        <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800">
          <h3 class="text-sm font-black text-emerald-400 mb-4 flex items-center gap-2">
            Top Productos de Alta Rotación (Alta Demanda)
          </h3>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/80 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th class="p-3">Producto</th>
                <th class="p-3 text-center">Cant. Vendida</th>
                <th class="p-3 text-right">Recaudado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              <tr v-for="p in datosRotacion.masVendidos" :key="p.id_producto" class="hover:bg-slate-800/50">
                <td class="p-3 font-bold text-white">{{ p.nombre_producto }}</td>
                <td class="p-3 text-center">
                  <span class="bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 font-black px-2 py-0.5 rounded-full">
                    {{ parseFloat(p.unidades_vendidas || 0) }} {{ p.unidad_medida === 'KILO' ? 'kg' : 'unids.' }}
                  </span>
                </td>
                <td class="p-3 text-right font-bold text-[#00D2C4]">${{ parseFloat(p.total_recaudado).toLocaleString('es-CL') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TOP MENOS VENDIDOS -->
        <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800">
          <h3 class="text-sm font-black text-amber-400 mb-4 flex items-center gap-2">
            Productos de Baja Rotación (Alerta de Stock Atrapado)
          </h3>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-900/80 text-slate-400 font-bold uppercase border-b border-slate-800">
                <th class="p-3">Producto</th>
                <th class="p-3 text-center">Stock Físico</th>
                <th class="p-3 text-right">Ventas Acumuladas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-slate-300">
              <tr v-for="p in datosRotacion.menosVendidos" :key="p.id_producto" class="hover:bg-slate-800/50">
                <td class="p-3 font-bold text-white">{{ p.nombre_producto }}</td>
                <td class="p-3 text-center">
                  <span class="bg-amber-950/50 text-amber-400 border border-amber-800/40 font-bold px-2 py-0.5 rounded-full">
                    {{ parseFloat(p.stock_actual || 0) }} {{ p.unidad_medida === 'KILO' ? 'kg en estante' : 'en estante' }}
                  </span>
                </td>
                <td class="p-3 text-right font-bold text-slate-400">
                  {{ parseFloat(p.unidades_vendidas || 0) }} {{ p.unidad_medida === 'KILO' ? 'kg' : 'unids.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PESTAÑA 3: HISTORIAL DE MOVIMIENTOS -->
    <div v-if="pestanaActiva === 'movimientos'" class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-sm font-black text-white">Bitácora de Auditoría de Inventario</h3>
        <div class="flex gap-2">
          <button @click="exportarMovimientosExcel" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
            Exportar Excel (.csv)
          </button>
          <button @click="exportarPDF" class="bg-[#DC143C] hover:bg-[#B22222] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-sm">
            Exportar PDF
          </button>
        </div>
      </div>  

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="bg-slate-900/80 text-slate-400 font-bold uppercase border-b border-slate-800">
              <th class="p-3">Fecha</th>
              <th class="p-3">Producto</th>
              <th class="p-3">Tipo Movimiento</th>
              <th class="p-3 text-center">Cantidad</th>
              <th class="p-3">Motivo / Justificación</th>
              <th class="p-3">Usuario Responsable</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 font-medium text-slate-300">
            <tr v-for="m in historialMovimientos" :key="m.id_movimiento" class="hover:bg-slate-800/50">
              <td class="p-3">{{ new Date(m.fecha_movimiento).toLocaleString('es-CL') }}</td>
              <td class="p-3 font-bold text-white">{{ m.productos?.nombre_producto }}</td>
              <td class="p-3">
                <span 
                  :class="m.tipo_movimiento === 'ENTRADA' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/50 text-red-400 border border-red-800/40'" 
                  class="font-black px-2 py-0.5 rounded text-[10px]"
                >
                  {{ m.tipo_movimiento }}
                </span>
              </td>
              <td class="p-3 text-center font-bold text-white">{{ m.cantidad }}</td>
              <td class="p-3 text-slate-400">{{ m.motivo || 'N/A' }}</td>
              <td class="p-3 font-bold text-slate-300">{{ m.usuarios?.nombre_usuario || 'Sistema' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
  </div>
</template>