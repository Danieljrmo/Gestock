<template>
  <div class="space-y-6">
    <!-- BLOQUE 1: Encabezado y Botones al estilo Módulo Reportes -->
    <div class="bg-[#0D1B2E] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
      <!-- Título y Subtítulo estilo Reportes -->
      <div>
        <h3 class="text-xl font-extrabold text-white">Gestión de Productos</h3>
        <p class="text-xs text-slate-400 mt-0.5">Catálogo general, control de precios y alertas de stock en Gestock.</p>
      </div>

      <!-- Barra contenedora para los 3 botones uniformes -->
      <div 
        v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')"
        class="bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center gap-2.5 w-full">
        <!-- Botón 1: Nueva Categoría -->
        <button 
          @click="showCategoryModal = true"
          class="w-full flex-1 bg-[#00D2C4] text-[#0B192C] hover:bg-[#00b8ac] font-black px-4 py-2.5 rounded-xl transition-all text-xs md:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95"
        >
          <span>📁</span> Nueva Categoría
        </button>

        <!-- Botón 2: Registrar Movimiento -->
        <button 
          @click="showMovementModal = true"
          class="w-full flex-1 bg-[#00D2C4] text-[#0B192C] hover:bg-[#00b8ac] font-black px-4 py-2.5 rounded-xl transition-all text-xs md:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95"
        >
          <span>🔄</span> Registrar Movimiento
        </button>

        <!-- Botón 3: Nuevo Producto -->
        <button 
          @click="openCreateModal"
          class="w-full flex-1 bg-[#00D2C4] text-[#0B192C] hover:bg-[#00b8ac] font-black px-4 py-2.5 rounded-xl transition-all text-xs md:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95"
        >
          <span>➕</span> Nuevo Producto
        </button>
      </div>
    </div>

    <!-- Mensajes de Alerta -->
    <div v-if="errorMsg" class="bg-red-950/40 text-red-400 p-4 rounded-xl text-sm font-semibold border border-red-800/40">
      ⚠️ {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="bg-emerald-950/40 text-emerald-400 p-4 rounded-xl text-sm font-semibold border border-emerald-800/40">
      ✅ {{ successMsg }}
    </div>

    <!-- BLOQUE 2: Filtros por Categoría con Scroll Horizontal Limpio -->
    <div class="bg-[#0D1B2E] p-4 rounded-2xl border border-slate-800 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-black uppercase text-slate-400">Categorías del Catálogo:</span>
        <span class="text-[11px] text-slate-500 font-medium">Desliza para ver más →</span>
      </div>

      <!-- Scroll Horizontal -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button 
          @click="selectCategory('todos')"
          :class="categorySelected === 'todos' ? 'bg-[#00D2C4] text-[#0B192C] font-black shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'"
          class="px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0"
        >
          🗂️ TODOS ({{ productos.length }})
        </button>

        <div 
          v-for="cat in categorias" 
          :key="cat.id_categoria"
          class="inline-flex items-center gap-1 bg-slate-900 rounded-xl p-1 flex-shrink-0 border border-slate-800"
        >
          <button 
            @click="selectCategory(cat.id_categoria)"
            :class="categorySelected === cat.id_categoria ? 'bg-[#00D2C4] text-[#0B192C] font-black shadow-sm' : 'text-slate-300 hover:text-white'"
            class="px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all"
          >
            {{ cat.nombre_categoria }}
          </button>
      
          <!-- Botón para eliminar categoría -->
          <button 
            v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')"
            @click="confirmarEliminarCategoria(cat)"
            class="p-1 text-slate-500 hover:text-red-400 rounded-md transition-colors"
            title="Eliminar Categoría"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA HORIZONTAL GLOBAL -->
      <div class="relative pt-2 border-t border-slate-800">
        <input 
          v-model="searchTerm"
          @input="applyFilter"
          type="text" 
          placeholder="🔍 Buscar por nombre de producto o código SKU en la categoría seleccionada..."
          class="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#00D2C4] transition-all"
        />
      </div>
    </div>

    <!-- BLOQUE 3: Tabla Maestra -->
    <div class="bg-[#0D1B2E] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-900/80 border-b border-slate-800">
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Código / SKU</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Producto</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">P. Compra</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">P. Venta</th>
              <th class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400">Stock Actual</th>
              <th 
                v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')"
                class="p-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-center"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800 text-sm font-medium text-slate-300">
            <tr v-if="loadingProducts">
              <td colspan="6" class="p-10 text-center text-slate-500 font-semibold animate-pulse">
                ⏳ Cargando catálogo de productos...
              </td>
            </tr>

            <tr v-else-if="productosFiltrados.length === 0">
              <td colspan="6" class="p-10 text-center text-slate-500 font-semibold">
                📦 No hay productos registrados en esta categoría.
              </td>
            </tr>

            <tr 
              v-else 
              v-for="prod in productosFiltrados" 
              :key="prod.id_producto" 
              class="hover:bg-slate-800/50 transition-colors"
            >
              <td class="p-5 font-mono text-xs text-slate-400">
                {{ prod.codigo_barra || 'S/N' }}
              </td>

              <td class="p-5">
                <div class="flex flex-col">
                  <span class="text-white font-bold text-sm">{{ prod.nombre_producto }}</span>
                  <span class="text-[11px] text-slate-400">
                    {{ prod.categorias?.nombre_categoria || 'ID Cat: ' + prod.id_categoria }}
                  </span>
                </div>
              </td>

              <td class="p-5 text-slate-400">
                ${{ prod.precio_compra?.toLocaleString('es-CL') || prod.precio_compra }}
              </td>

              <td class="p-5 text-white font-semibold">
                ${{ prod.precio_venta?.toLocaleString('es-CL') || prod.precio_venta }}
              </td>

              <td class="p-5">
                <span 
                  :class="parseFloat(prod.stock_actual) <= parseFloat(prod.stock_minimo || 5) 
                    ? 'bg-red-950/50 text-red-400 border border-red-800/40' 
                    : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'"
                  class="px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1"
                >
                  <span v-if="parseFloat(prod.stock_actual) <= parseFloat(prod.stock_minimo || 5)">⚠️</span>
                  {{ parseFloat(prod.stock_actual) }} {{ prod.unidad_medida === 'KILO' ? 'kg' : 'unids.' }}
                </span>
              </td>

              <td 
                v-if="authStore.user?.rol?.toUpperCase().startsWith('ADMIN')"
                class="p-5 text-center"
              >
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="openEditModal(prod)"
                    class="p-2 text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Editar Producto"
                  >
                    ✏️
                  </button>
                  <button 
                    @click="handleDisableProduct(prod.id_producto, prod.nombre_producto)"
                    class="p-2 text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                    title="Dar de Baja"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL POPUP: NUEVA CATEGORÍA -->
    <div v-if="showCategoryModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div class="bg-[#0D1B2E] rounded-3xl p-8 max-w-md w-full border border-slate-800 relative text-white">
        <button @click="showCategoryModal = false" class="absolute top-5 right-5 text-slate-400 hover:text-white font-bold text-xl">✕</button>
        
        <h3 class="text-xl font-black text-white mb-2">📁 Crear Nueva Categoría</h3>
        <p class="text-xs text-slate-400 mb-6">Define una nueva clasificación para agrupar tus productos en Gestock.</p>

        <form @submit.prevent="handleCreateCategory" class="space-y-4">
          <div>
            <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Nombre de la Categoría</label>
            <input 
              v-model="newCategoryName"
              type="text" 
              required
              placeholder="Ej: Bebidas, Lácteos, Limpieza..."
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
            />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              @click="showCategoryModal = false"
              class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="submittingCategory"
              class="px-5 py-2.5 rounded-xl bg-[#00D2C4] text-[#0B192C] font-black text-sm hover:bg-[#00b8ac] transition-all disabled:opacity-50"
            >
              {{ submittingCategory ? 'Guardando...' : 'Guardar Categoría' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL POPUP NUEVO PRODUCTO -->
    <div v-if="showProductModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div class="bg-[#0D1B2E] rounded-3xl p-8 max-w-2xl w-full border border-slate-800 relative max-h-[90vh] overflow-y-auto text-white">
        <button @click="showProductModal = false; resetProductForm()" class="absolute top-5 right-5 text-slate-400 hover:text-white font-bold text-xl">✕</button>
        
        <h3 class="text-xl font-black text-white mb-2">
          {{ isEditing ? '✏️ Editar Producto' : '📦 Registrar Nuevo Producto' }}
        </h3>
        <p class="text-xs text-slate-400 mb-6">Ingresa las especificaciones, costos y niveles de stock iniciales para el catálogo.</p>

        <form @submit.prevent="handleSubmitProduct" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Código de Barras / SKU</label>
              <input 
                v-model="productForm.codigo_barra"
                type="text" 
                required
                placeholder="Ej: 7751234567890"
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
              />
            </div>
            <div>
              <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Categoría</label>
              <select 
                v-model="productForm.id_categoria"
                required
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
              >
                <option value="" disabled>Selecciona una categoría...</option>
                <option 
                  v-for="cat in categorias" 
                  :key="cat.id_categoria || cat.id" 
                  :value="cat.id_categoria || cat.id"
                >
                  {{ cat.nombre_categoria || cat.nombre }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Nombre del Producto</label>
            <input 
              v-model="productForm.nombre_producto"
              type="text" 
              required
              placeholder="Ej: Papas Fritas Lays Tarro 150g"
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Precio Costo (Compra)</label>
              <div class="relative">
                <span class="absolute left-4 top-3.5 text-slate-500 text-sm font-bold">$</span>
                <input 
                  v-model="productForm.precio_compra"
                  type="number" 
                  min="0"
                  required
                  placeholder="850"
                  class="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
                />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Precio de Venta Público</label>
              <div class="relative">
                <span class="absolute left-4 top-3.5 text-slate-500 text-sm font-bold">$</span>
                <input 
                  v-model="productForm.precio_venta"
                  type="number" 
                  min="0"
                  required
                  placeholder="1200"
                  class="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
                />
              </div>
            </div>
          </div>

          <!-- UNIDAD DE MEDIDA -->
          <div>
            <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">Unidad de Medida</label>
            <select 
              v-model="productForm.unidad_medida"
              required
              class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4] transition-all"
            >
              <option value="UNIDAD">Unidad (ud)</option>
              <option value="KILO">Kilogramo (kg)</option>
            </select>
          </div>

          <!-- STOCK INICIAL Y ALERTA STOCK MÍNIMO -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Stock Inicial -->
            <div>
              <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">
                Stock Inicial {{ productForm.unidad_medida === 'KILO' ? '(Kg)' : '(Unidades)' }}
              </label>
              <input 
                v-model="productForm.stock_actual" 
                type="number" 
                :step="productForm.unidad_medida === 'KILO' ? '0.001' : '1'"
                :min="productForm.unidad_medida === 'KILO' ? '0.001' : '0'"
                required 
                :placeholder="productForm.unidad_medida === 'KILO' ? 'Ej: 10.500' : 'Ej: 30'"
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4]"
              />
            </div>

            <!-- Alerta Stock Mínimo -->
            <div>
              <label class="block text-[11px] font-black tracking-wider uppercase text-slate-400 mb-2">
                Alerta Stock Mínimo {{ productForm.unidad_medida === 'KILO' ? '(Kg)' : '(Unidades)' }}
              </label>
              <input 
                v-model="productForm.stock_minimo" 
                type="number" 
                :step="productForm.unidad_medida === 'KILO' ? '0.001' : '1'"
                :min="productForm.unidad_medida === 'KILO' ? '0.001' : '1'"
                required 
                :placeholder="productForm.unidad_medida === 'KILO' ? 'Ej: 1.000' : 'Ej: 5'"
                class="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-semibold focus:outline-none focus:border-[#00D2C4]"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-5 border-t border-slate-800">
            <button 
              type="button" 
              @click="showProductModal = false; resetProductForm()"
              class="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="submittingProduct"
              class="px-5 py-2.5 rounded-xl bg-[#00D2C4] text-[#0B192C] font-black text-sm hover:bg-[#00b8ac] transition-all disabled:opacity-50"
            >
              {{ submittingProduct ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Registrar Producto') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL POPUP NUEVO MOVIMIENTO -->
    <MovementsModal 
      :show="showMovementModal"
      :productos="productos" 
      @close="showMovementModal = false"
      @saved="fetchProducts" 
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import MovementsModal from './MovementsModal.vue';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const authStore = useAuthStore();
const errorMsg = ref('');
const successMsg = ref('');

// --- ESTADOS DE CATEGORÍAS ---
const categorias = ref([]);
const categorySelected = ref('todos');
const showCategoryModal = ref(false);
const submittingCategory = ref(false);
const newCategoryName = ref('');

// --- ESTADOS DE PRODUCTOS ---
const showProductModal = ref(false);
const productos = ref([]);
const productosFiltrados = ref([]);
const loadingProducts = ref(false);
const showMovementModal = ref(false);
const searchTerm = ref(''); // 

// NUEVOS ESTADOS PARA MANEJO DE EDICIÓN
const isEditing = ref(false);
const currentProductId = ref(null);

// --- ESTADOS FORMULARIO PRODUCTO ---
const submittingProduct = ref(false);
const productForm = ref({
  codigo_barra: '',
  nombre_producto: '',
  precio_compra: '',
  precio_venta: '',
  stock_actual: '',
  stock_minimo: 5,
  id_categoria: '',
  unidad_medida: 'UNIDAD'
});

const resetProductForm = () => {
  productForm.value = {
    codigo_barra: '',
    nombre_producto: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: 5,
    id_categoria: '',
    unidad_medida: 'UNIDAD'
  };
  isEditing.value = false;
  currentProductId.value = null;
};

const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/categorias`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    categorias.value = Array.isArray(response.data) ? response.data : response.data.categorias || [];
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    errorMsg.value = 'No se pudieron cargar las categorías del inventario.';
  }
};

const handleCreateCategory = async () => {
  if (!newCategoryName.value.trim()) return;
  try {
    submittingCategory.value = true;
    errorMsg.value = '';
    successMsg.value = '';

    await axios.post(`${API_BASE_URL}/api/categorias`, 
      { nombre_categoria: newCategoryName.value }, 
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );

    successMsg.value = '¡Categoría creada exitosamente!';
    newCategoryName.value = '';
    showCategoryModal.value = false;
    await fetchCategories();
  } catch (error) {
    console.error('Error al crear categoría:', error);
    errorMsg.value = error.response?.data?.mensaje || 'No se pudo registrar la categoría.';
  } finally {
    submittingCategory.value = false;
  }
};

const fetchProducts = async () => {
  try {
    loadingProducts.value = true;
    const response = await axios.get(`${API_BASE_URL}/api/productos`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    const data = Array.isArray(response.data) ? response.data : response.data.productos || [];
    productos.value = data;
    applyFilter();
  } catch (error) {
    console.error('Error al cargar productos:', error);
    errorMsg.value = 'No se pudieron cargar los productos del inventario.';
  } finally {
    loadingProducts.value = false;
  }
};

// 2. APLICAR FILTRO COMBINADO (CATEGORÍA + BUSCADOR DE TEXTO)
const applyFilter = () => {
  let resultado = productos.value;

  // Filtrar por categoría
  if (categorySelected.value !== 'todos') {
    resultado = resultado.filter(p => p.id_categoria === categorySelected.value);
  }

  // Filtrar por texto en el buscador
  if (searchTerm.value.trim()) {
    const query = searchTerm.value.toLowerCase().trim();
    resultado = resultado.filter(p => 
      p.nombre_producto.toLowerCase().includes(query) ||
      (p.codigo_barra && p.codigo_barra.includes(query))
    );
  }

  productosFiltrados.value = resultado;
};

// --- FUNCIÓN INTERMEDIARIA PARA EL FORMULARIO ---
const handleSubmitProduct = async () => {
  if (isEditing.value) {
    await handleUpdateProduct();
  } else {
    await handleCreateProduct();
  }
};

const handleCreateProduct = async () => {
  if (!productForm.value.id_categoria) {
    errorMsg.value = 'Por favor, selecciona una categoría para el producto.';
    return;
  }
  try {
    submittingProduct.value = true;
    errorMsg.value = '';
    successMsg.value = '';

    const payload = {
      codigo_barra: productForm.value.codigo_barra.trim(),
      nombre_producto: productForm.value.nombre_producto.trim(),
      precio_compra: parseFloat(productForm.value.precio_compra),
      precio_venta: parseFloat(productForm.value.precio_venta),
      stock_actual: parseFloat(productForm.value.stock_actual),
      stock_minimo: parseFloat(productForm.value.stock_minimo),
      unidad_medida: productForm.value.unidad_medida || 'UNIDAD',
      id_categoria: parseInt(productForm.value.id_categoria)
    };

    await axios.post(`${API_BASE_URL}/api/productos`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    successMsg.value = `¡Producto "${payload.nombre_producto}" registrado con éxito!`;
    showProductModal.value = false;
    resetProductForm();
    await fetchProducts();
  } catch (error) {
    console.error('Error al crear producto:', error);
    errorMsg.value = error.response?.data?.mensaje || 'Error al guardar el producto en el inventario.';
  } finally {
    submittingProduct.value = false;
  }
};

// ACTUALIZAR PRODUCTO EXISTENTE (PUT)
const handleUpdateProduct = async () => {
  try {
    submittingProduct.value = true;
    errorMsg.value = '';
    successMsg.value = '';

    const payload = {
      codigo_barra: productForm.value.codigo_barra.trim(),
      nombre_producto: productForm.value.nombre_producto.trim(),
      precio_compra: parseFloat(productForm.value.precio_compra),
      precio_venta: parseFloat(productForm.value.precio_venta),
      stock_actual: parseFloat(productForm.value.stock_actual),
      stock_minimo: parseFloat(productForm.value.stock_minimo),
      unidad_medida: productForm.value.unidad_medida || 'UNIDAD',
      id_categoria: parseInt(productForm.value.id_categoria)
    };

    await axios.put(`${API_BASE_URL}/api/productos/${currentProductId.value}`, payload, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    successMsg.value = `¡Producto "${payload.nombre_producto}" actualizado con éxito!`;
    showProductModal.value = false;
    resetProductForm();
    await fetchProducts();
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    errorMsg.value = error.response?.data?.mensaje || 'Error al actualizar el producto.';
  } finally {
    submittingProduct.value = false;
  }
};

const selectCategory = (id) => {
  categorySelected.value = id;
  applyFilter();
};

const openCreateModal = () => {
  resetProductForm();
  isEditing.value = false;
  showProductModal.value = true;
};

// ACTIVACIÓN DEL MODO EDICIÓN PRECARGANDO DATOS
const openEditModal = (producto) => {
  errorMsg.value = '';
  successMsg.value = '';
  isEditing.value = true;
  
  const idLimpia = producto.id_producto || producto.id;
  currentProductId.value = parseInt(idLimpia);
  
  productForm.value = {
    codigo_barra: producto.codigo_barra || '',
    nombre_producto: producto.nombre_producto || '',
    precio_compra: producto.precio_compra || '',
    precio_venta: producto.precio_venta || '',
    stock_actual: producto.stock_actual !== undefined ? producto.stock_actual : '',
    stock_minimo: producto.stock_minimo !== undefined ? producto.stock_minimo : 5,
    id_categoria: producto.id_categoria || '',
    unidad_medida: producto.unidad_medida || 'UNIDAD'
  };
  
  showProductModal.value = true;
};

// DAR DE BAJA UN PRODUCTO
const handleDisableProduct = async (id, nombre) => {
  const confirmar = confirm(`¿Estás seguro de que deseas dar de baja el producto "${nombre}"?`);
  if (!confirmar) return;

  try {
    errorMsg.value = '';
    successMsg.value = '';
    const idLimpia = parseInt(id);

    await axios.delete(`${API_BASE_URL}/api/productos/${idLimpia}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });

    successMsg.value = `El producto "${nombre}" ha sido dado de baja correctamente.`;
    await fetchProducts();
  } catch (error) {
    console.error('Error al dar de baja el producto:', error);
    errorMsg.value = error.response?.data?.mensaje || 'No se pudo dar de baja el producto en el servidor.';
  }
};

// FUNCION PARA ELIMINAR UNA CATEGORIA CON ALERTA DE CONFIRMACIÓN Y VERIFICACIÓN DE PRODUCTOS ASIGNADOS
const confirmarEliminarCategoria = async (cat) => {
  // Extraemos la ID asegurándonos de que sea un número puro
  const idLimpia = parseInt(cat.id_categoria || cat.id);

  if (!idLimpia || isNaN(idLimpia)) {
    errorMsg.value = 'ID de categoría inválido.';
    return;
  }

  const productosAfectados = productos.value.filter(
    p => parseInt(p.id_categoria) === idLimpia
  ).length;

  let mensaje = `¿Estás seguro de que deseas eliminar la categoría "${cat.nombre_categoria}"?`;
  if (productosAfectados > 0) {
    mensaje = `⚠️ ¡ALERTA CRÍTICA DE INVENTARIO!\n\nLa categoría "${cat.nombre_categoria}" tiene ${productosAfectados} producto(s) asignado(s).\n\nSi la eliminas, esos productos no se borrarán pero quedarán en el grupo "Sin Categoría". ¿Deseas continuar?`;
  }

  if (confirm(mensaje)) {
    try {
      errorMsg.value = '';
      successMsg.value = '';

      await axios.delete(`${API_BASE_URL}/api/categorias/${idLimpia}`, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });

      successMsg.value = `Categoría "${cat.nombre_categoria}" eliminada correctamente.`;

      if (categorySelected.value === idLimpia) {
        categorySelected.value = 'todos';
      }

      await fetchCategories();
      await fetchProducts();
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      errorMsg.value = err.response?.data?.mensaje || 'No se pudo eliminar la categoría en el servidor.';
    }
  }
};

onMounted(() => {
  fetchCategories();
  fetchProducts();
});
</script>
