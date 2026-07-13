"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus, Search, Filter, ShoppingBag, Edit, Trash2, Tag, Layers, AlertTriangle, Save, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Drawer from "@/components/ui/Drawer";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    category: "Service",
    description: "",
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/product");
      setProducts(response.data.data);
    } catch (err) {
      console.error("Fetch Products Error:", err);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchProducts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchProducts]);

  const openProductEditor = (product?: any) => {
    setEditingProduct(product || null);
    setProductForm({
      name: product?.name || "",
      price: String(product?.price || ""),
      category: product?.category || "Service",
      description: product?.description || "",
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...productForm };

    try {
      if (editingProduct) {
        await api.put(`/product/${editingProduct.id}`, payload);
        setProducts((prev) => prev.map((product) => product.id === editingProduct.id ? { ...product, ...payload } : product));
        showToast("Product updated successfully", "success");
      } else {
        const response = await api.post("/product", payload);
        setProducts((prev) => [...prev, response.data.data || { id: Date.now(), ...payload }]);
        showToast("Product created successfully", "success");
      }
      setIsAddOpen(false);
    } catch (err) {
      console.error("Save Product Error:", err);
      if (editingProduct) {
        setProducts((prev) => prev.map((product) => product.id === editingProduct.id ? { ...product, ...payload } : product));
        showToast("Product saved locally. PHP endpoint needs to persist it.", "error");
      } else {
        setProducts((prev) => [...prev, { id: Date.now(), ...payload }]);
        showToast("Product added locally. PHP endpoint needs to persist it.", "error");
      }
      setIsAddOpen(false);
    }
  };

  const handleDelete = async () => {
    if (deletingProductId) {
      try {
        await api.delete(`/product/${deletingProductId}`);
        setProducts(prev => prev.filter(p => p.id !== deletingProductId));
        showToast("Product deleted successfully", "success");
        setDeletingProductId(null);
      } catch (err) {
        console.error("Delete Product Error:", err);
        setProducts(prev => prev.filter(p => p.id !== deletingProductId));
        showToast("Product removed locally. PHP endpoint needs to persist it.", "error");
        setDeletingProductId(null);
      }
    }
  };

  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = searchTerm
      ? [p.name, p.description, p.category, p.price].some((value) => String(value || "").toLowerCase().includes(search))
      : true;
    const matchesCategory = categoryFilter === "All Categories" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Products</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Products</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchProducts}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Button 
                onClick={() => openProductEditor()}
                className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="h-3.5 w-3.5 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        {/* Filter Section */}
        <Card className="p-5 border-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
              >
                <option>All Categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <Button 
                onClick={() => {setSearchTerm(""); setCategoryFilter("All Categories");}}
                className="bg-white text-gray-400 hover:text-gray-600 border border-gray-100 text-[10px] font-black h-11 uppercase tracking-widest"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Reset
            </Button>
          </div>
        </Card>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-0 overflow-hidden border-none shadow-sm group hover:shadow-xl transition-all duration-300 bg-white">
              <div className="h-44 bg-gray-50/50 flex items-center justify-center relative overflow-hidden">
                <ShoppingBag className="h-14 w-14 text-gray-200 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                   <button onClick={() => openProductEditor(product)} className="p-2.5 bg-white rounded-xl shadow-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all" title="Edit product"><Edit className="h-4 w-4" /></button>
                   <button onClick={() => setDeletingProductId(product.id)} className="p-2.5 bg-white rounded-xl shadow-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xs font-black text-gray-800 mb-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{product.category || "Uncategorized"}</p>
                
                <div className="flex items-end justify-between mt-4">
                  <div>
                    <p className="text-[8px] text-gray-400 font-black uppercase mb-0.5">Price</p>
                    <span className="text-lg font-black text-gray-900">{product.price}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-gray-400 font-black uppercase mb-0.5">Taxes</p>
                    <p className="text-[10px] font-black text-gray-500">{product.taxes ? product.taxes : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {!loading && filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
               <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-200" />
               </div>
               <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Drawer */}
      <Drawer
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name *</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price *</label>
              <input
                type="text"
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none"
                placeholder="$ 0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
              <select
                value={productForm.category}
                onChange={(event) => setProductForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
              >
                <option>Digital</option>
                <option>Physical</option>
                <option>Service</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
            <textarea
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-32"
            ></textarea>
          </div>

          <div className="pt-6 flex space-x-3">
             <Button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 bg-gray-100 text-gray-500 border-none h-12 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
             <Button className="flex-1 bg-primary text-white h-12 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                <Save className="h-4 w-4 mr-2" /> Save Product
             </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="text-center py-4">
           <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
           </div>
           <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product?</h3>
           <p className="text-xs text-gray-500 font-medium leading-relaxed mb-8">
             Are you sure you want to remove this product? This action cannot be undone.
           </p>
           <div className="flex space-x-3">
              <Button onClick={() => setDeletingProductId(null)} className="flex-1 bg-gray-100 text-gray-600 border-none h-11 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleDelete} className="flex-1 bg-red-500 text-white h-11 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-200">Delete</Button>
           </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
