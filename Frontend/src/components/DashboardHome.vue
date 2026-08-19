<template>
  <div class="space-y-6">
    
    <!-- ENCABEZADO CON BIENVENIDA Y TARJETA DE CALENDARIO DE HOY -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Saludo e Información general -->
      <div class="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-2xl font-black text-[#0B192C] dark:text-white">
              ¡Hola, {{ authStore.user?.nombre || (authStore.user?.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Cajero') }}! 👋
            </h3>
            <span class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold px-3 py-1 rounded-full text-[11px] flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sistema en Línea
            </span>
          </div>
          <p class="text-xs text-gray-400 dark:text-slate-400">Panel de Control Operativo y Financiero de Gestock.</p>
        </div>
        <p class="text-xs font-semibold text-gray-500 dark:text-slate-400 mt-4">
          <span class="text-[#00D2C4] font-bold">Tip de Gestión:</span> Mantén tus niveles de stock mínimo actualizados para recibir alertas tempranas.
        </p>
      </div>

      <!-- TARJETA CALENDARIO Y FECHA ACTIVA -->
      <div class="bg-gradient-to-br from-[#0B192C] to-slate-900 text-white p-5 rounded-2xl shadow-md border-l-4 border-[#00D2C4] flex items-center justify-between">
        <div class="space-y-1">
          <span class="text-[10px] uppercase font-black tracking-widest text-[#00D2C4]">Fecha de Operación</span>
          <h4 class="text-lg font-black capitalize">{{ fechaFormateada.diaSemana }}, {{ fechaFormateada.diaNum }} de {{ fechaFormateada.mes }}</h4>
          <p class="text-xs text-gray-300 font-semibold">{{ fechaFormateada.anio }} — Chile </p>
        </div>
        <div class="text-3xl bg-white/10 p-3 rounded-2xl border border-white/10">
          📅
        </div>
      </div>

    </div>

    <!-- TARJETAS DE KPIS PRINCIPALES -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      
      <!-- 1. Total Recaudado Bruto -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-800 border-l-4 border-l-[#0B192C] dark:border-l-[#00D2C4] transition-all flex justify-between items-center group">
        <div>
          <span class="text-[11px] font-black uppercase text-gray-400 dark:text-slate-400 tracking-wider">Total Recaudado (Bruto)</span>
          <h4 class="text-2xl font-black text-[#0B192C] dark:text-white mt-1">${{ kpis.totalRecaudado.toLocaleString('es-CL') }}</h4>
          <span class="text-[10px] font-bold text-gray-400 dark:text-slate-500">Ingresos Acumulados</span>
        </div>
        <div class="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl transition-all">
          💵
        </div>
      </div>

      <!-- 2. Ventas del Día -->
      <div class="bg-[#0D1B2E] p-5 rounded-2xl shadow-sm border border-slate-800 border-l-4 border-l-[#00D2C4] flex justify-between items-center">
        <div>
          <span class="text-[11px] font-black uppercase text-slate-400 tracking-wider">Ventas del Día</span>
          <h4 class="text-2xl font-black text-white mt-1">${{ kpis.ventasHoy.toLocaleString('es-CL') }}</h4>
          <span class="text-[10px] font-bold text-emerald-400">🟢 Registradas Hoy</span>
        </div>
        <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-xl border border-slate-800">📈</div>
      </div>

      <!-- 3. Número de Transacciones (Ventas) -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-800 border-l-4 border-l-[#0B192C] dark:border-l-[#00D2C4] transition-all flex justify-between items-center group">
        <div>
          <span class="text-[11px] font-black uppercase text-gray-400 dark:text-slate-400 tracking-wider">N° Transacciones (Ventas)</span>
          <h4 class="text-2xl font-black text-[#0B192C] dark:text-white mt-1">{{ kpis.totalTransacciones }} <span class="text-xs text-gray-400 dark:text-slate-500 font-bold">boletas</span></h4>
          <span class="text-[10px] font-bold text-gray-400 dark:text-slate-500">Atendidas en Caja</span>
        </div>
        <div class="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xl transition-all">
          🛒
        </div>
      </div>

      <!-- 4. Ticket Promedio -->
      <div class="bg-[#0D1B2E] p-5 rounded-2xl shadow-sm border border-slate-800 border-l-4 border-l-[#00D2C4] flex justify-between items-center">
        <div>
          <span class="text-[11px] font-black uppercase text-slate-400 tracking-wider">Ticket Promedio</span>
          <h4 class="text-2xl font-black text-[#00D2C4] mt-1">${{ kpis.ticketPromedio.toLocaleString('es-CL') }}</h4>
          <span class="text-[10px] font-bold text-slate-500">Monto Promedio / Cliente</span>
        </div>
        <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-xl border border-slate-800">🏷️</div>
      </div>

      <!-- 5. Alertas de Stock Crítico -->
      <div class="bg-[#0D1B2E] p-5 rounded-2xl shadow-sm border border-slate-800 border-l-4 border-l-[#00D2C4] flex justify-between items-center">
        <div>
          <span class="text-[11px] font-black uppercase text-slate-400 tracking-wider">Alertas de Stock</span>
          <h4 :class="['text-2xl font-black mt-1', kpis.alertasStock > 0 ? 'text-[#DC143C]' : 'text-white']">
            {{ kpis.alertasStock }} <span class="text-xs text-slate-500 font-bold">artículos</span>
          </h4>
          <span class="text-[10px] font-bold text-amber-400">Bajo Stock Mínimo</span>
        </div>
        <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-xl border border-slate-800">⚠️</div>
      </div>

      <!-- 6. Valor Total del Inventario -->
      <div class="bg-[#0D1B2E] p-5 rounded-2xl shadow-sm border border-slate-800 border-l-4 border-l-[#00D2C4] flex justify-between items-center">
        <div>
          <span class="text-[11px] font-black uppercase text-slate-400 tracking-wider">Capital en Stock</span>
          <h4 class="text-2xl font-black text-emerald-400 mt-1">${{ kpis.valorInventario.toLocaleString('es-CL') }}</h4>
          <span class="text-[10px] font-bold text-slate-500">Valor de Venta del Inventario</span>
        </div>
        <div class="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-xl border border-slate-800">💰</div>
      </div>

    </div>

    <!-- SECCIÓN DE GRÁFICOS -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <h3 class="text-sm font-black text-[#0B192C] dark:text-white mb-4">📊 Tendencia de Ventas Semanales</h3>
        <div class="h-64">
          <Bar :data="barData" :options="barOptions" />
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
        <h3 class="text-sm font-black text-[#0B192C] dark:text-white mb-4">🍕 Participación por Categoría</h3>
        <div class="h-64">
          <Doughnut :data="doughnutData" :options="doughnutOptions" />
        </div>
      </div>
    </div>

    <!-- TABLA DE ALERTAS RÁPIDAS DE REPOSICIÓN -->
    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
      <h3 class="text-sm font-black text-[#DC143C] mb-4 flex items-center gap-2">
        ⚠️ Productos Críticos sin Stock Mínimo
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800 text-gray-400 dark:text-slate-400 font-bold uppercase border-b border-gray-100 dark:border-slate-700">
              <th class="p-3">Producto</th>
              <th class="p-3 text-center">Stock Actual</th>
              <th class="p-3 text-center">Stock Mínimo</th>
              <th class="p-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-slate-800">
            <tr v-for="p in productosCriticos" :key="p.id_producto" class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td class="p-3 font-bold text-[#0B192C] dark:text-white">{{ p.nombre_producto }}</td>
              <td class="p-3 text-center font-black text-[#DC143C]">
                {{ parseFloat(p.stock_actual) }} {{ p.unidad_medida === 'KILO' ? 'kg' : 'unids.' }}
              </td>
              <td class="p-3 text-center font-bold text-gray-500 dark:text-slate-400">
                {{ parseFloat(p.stock_minimo) }} {{ p.unidad_medida === 'KILO' ? 'kg' : 'unids.' }}
              </td>
              <td class="p-3 text-right">
                <span class="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-black px-2.5 py-1 rounded-full text-[10px]">
                  Reponer
                </span>
              </td>
            </tr>
            <tr v-if="productosCriticos.length === 0">
              <td colspan="4" class="p-4 text-center text-gray-400 dark:text-slate-500 font-bold">
                ✅ Todo el inventario está sobre los niveles mínimos requeridos.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';
import { useAuthStore } from '../stores/auth';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const cargando = ref(true);
const authStore = useAuthStore();

// FECHA ACTUAL FORMATEADA
const hoyObj = new Date();
const fechaFormateada = computed(() => {
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const Partes = hoyObj.toLocaleDateString('es-CL', opciones).split(' ');
  return {
    diaSemana: hoyObj.toLocaleDateString('es-CL', { weekday: 'long' }),
    diaNum: hoyObj.getDate(),
    mes: hoyObj.toLocaleDateString('es-CL', { month: 'long' }),
    anio: hoyObj.getFullYear()
  };
});

// ESTADOS DE KPIS
const kpis = ref({
  totalRecaudado: 0,
  ventasHoy: 0,
  totalTransacciones: 0,
  ticketPromedio: 0,
  alertasStock: 0,
  valorInventario: 0
});

const productosCriticos = ref([]);

// CONFIGURACIÓN GRÁFICO DE BARRAS
const barData = ref({
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  datasets: [{
    label: 'Ventas ($)',
    backgroundColor: '#00D2C4',
    borderRadius: 8,
    data: [12000, 19000, 15000, 25000, 22000, 30000, 41088]
  }]
});

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: '#F1F5F9' }, ticks: { font: { weight: 'bold' } } },
    x: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
  }
};

// CONFIGURACIÓN E INICIALIZACIÓN DEL GRÁFICO DE TORTA
const doughnutData = ref({
  labels: ['Cargando...'],
  datasets: [{
    backgroundColor: ['#0B192C', '#00D2C4', '#10B981', '#F59E0B', '#DC143C', '#8B5CF6'],
    data: [0]
  }]
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } },
    tooltip: {
      callbacks: {
        label: (context) => {
          const valor = context.raw || 0;
          return ` Recaudado: $${parseFloat(valor).toLocaleString('es-CL')}`;
        }
      }
    }
  }
};

// CARGAR DATOS REALES DE LA API PARA KPIS Y GRÁFICOS
const cargarDatosDashboard = async () => {
  try {
    cargando.value = true;
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Cargar Productos (Alertas + Valor Total del Inventario)
    const resProd = await axios.get('http://localhost:4000/api/productos', { headers });
    const productos = Array.isArray(resProd.data) ? resProd.data : resProd.data.productos || [];
    
    productosCriticos.value = productos
      .filter(p => p.stock_actual <= p.stock_minimo)
      .slice(0, 5);

    kpis.value.alertasStock = productosCriticos.value.length;
    
    kpis.value.valorInventario = productos.reduce((acc, p) => {
      return acc + (parseFloat(p.stock_actual || 0) * parseFloat(p.precio_venta || 0));
    }, 0);

    // 2. Cargar Ventas para KPIs y Gráficos
    const resVentas = await axios.get('http://localhost:4000/api/reportes/periodo', { headers });
    const ventas = resVentas.data.ventas || [];

    kpis.value.totalRecaudado = resVentas.data.metricas?.totalVendido || 0;
    kpis.value.totalTransacciones = resVentas.data.metricas?.totalTransacciones || ventas.length;

    const hoyStr = new Date().toISOString().split('T')[0];
    const ventasHoyArr = ventas.filter(v => v.fecha_venta.startsWith(hoyStr));

    kpis.value.ventasHoy = ventasHoyArr.reduce((acc, v) => acc + parseFloat(v.total), 0);
    kpis.value.ticketPromedio = ventas.length > 0 ? Math.round(kpis.value.totalRecaudado / ventas.length) : 0;

    // 3. GENERAR DATA REAL PARA EL GRÁFICO DE TORTA (PARTICIPACIÓN POR CATEGORÍA)
    const conteoCategorias = {};

    ventas.forEach(v => {
      if (v.detalle_venta && Array.isArray(v.detalle_venta)) {
        v.detalle_venta.forEach(det => {
          // Buscamos la categoría del producto en la lista general de productos
          const prodRelacionado = productos.find(p => p.id_producto === det.id_producto);
          const nombreCat = prodRelacionado?.categorias?.nombre_categoria || 'Sin Categoría';
          
          const montoVentaItem = parseFloat(det.subtotal || 0);
          conteoCategorias[nombreCat] = (conteoCategorias[nombreCat] || 0) + montoVentaItem;
        });
      }
    });

    const labelsCat = Object.keys(conteoCategorias);
    const valoresCat = Object.values(conteoCategorias);

    if (labelsCat.length > 0) {
      doughnutData.value = {
        labels: labelsCat,
        datasets: [{
          backgroundColor: ['#0B192C', '#00D2C4', '#10B981', '#F59E0B', '#DC143C', '#8B5CF6'],
          data: valoresCat
        }]
      };
    }

  } catch (err) {
    console.error('Error cargando Dashboard:', err);
  } finally {
    cargando.value = false;
  }
};

onMounted(() => {
  cargarDatosDashboard();
});
</script>