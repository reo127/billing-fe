'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { purchasesAPI, suppliersAPI, productsAPI } from '@/utils/api';
import { HiArrowLeft, HiPlus, HiTrash } from 'react-icons/hi';
import Link from 'next/link';

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplier: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    purchaseDate: new Date().toISOString().split('T')[0],
    items: [],
    freightCharges: 0,
    packagingCharges: 0,
    otherCharges: 0,
    discount: 0,
    paymentStatus: 'UNPAID',
    paymentMode: 'CREDIT',
    paidAmount: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [suppliersData, productsData] = await Promise.all([
        suppliersAPI.getAll(),
        productsAPI.getAll()
      ]);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(error.message);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product: '',
          batchNo: '',
          expiryDate: '',
          quantity: 1,
          freeQuantity: 0,
          purchasePrice: 0,
          mrp: 0,
          sellingPrice: 0,
          gstRate: 12,
          discount: 0
        }
      ]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotal = (item) => {
    const taxableAmount = (item.quantity * item.purchasePrice) - (item.discount || 0);
    const gstAmount = (taxableAmount * item.gstRate) / 100;
    return taxableAmount + gstAmount;
  };

  const calculateTotals = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const additionalCharges = (formData.freightCharges || 0) + (formData.packagingCharges || 0) + (formData.otherCharges || 0);
    const grandTotal = itemsTotal + additionalCharges - (formData.discount || 0);

    const totalGST = formData.items.reduce((sum, item) => {
      const taxableAmount = (item.quantity * item.purchasePrice) - (item.discount || 0);
      return sum + ((taxableAmount * item.gstRate) / 100);
    }, 0);

    const subtotal = itemsTotal - totalGST;

    return { subtotal, totalGST, grandTotal };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (!formData.supplier) {
      alert('Please select a supplier');
      return;
    }

    // Validate all items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product) {
        alert(`Please select product for item ${i + 1}`);
        return;
      }
      if (!item.batchNo) {
        alert(`Please enter batch number for item ${i + 1}`);
        return;
      }
      if (!item.expiryDate) {
        alert(`Please enter expiry date for item ${i + 1}`);
        return;
      }
      if (item.quantity <= 0) {
        alert(`Please enter valid quantity for item ${i + 1}`);
        return;
      }
      if (item.purchasePrice <= 0) {
        alert(`Please enter valid purchase price for item ${i + 1}`);
        return;
      }
    }

    setLoading(true);

    try {
      const totals = calculateTotals();
      const purchaseData = {
        ...formData,
        subtotal: totals.subtotal,
        totalGST: totals.totalGST,
        grandTotal: totals.grandTotal
      };

      await purchasesAPI.create(purchaseData);
      alert('Purchase entry added successfully!');
      router.push('/dashboard/purchases');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/purchases" className="text-gray-600 hover:text-gray-900">
            <HiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Purchase Entry</h1>
            <p className="text-gray-500 mt-1">Enter purchase details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name} - {supplier.gstin}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Bill Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bill Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <HiPlus className="w-5 h-5" />
                Add Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added. Click "Add Item" to start.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.product}
                          onChange={(e) => updateItem(index, 'product', e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} - {product.genericName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Batch No <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.batchNo}
                          onChange={(e) => updateItem(index, 'batchNo', e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => updateItem(index, 'expiryDate', e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                          min="1"
                          step="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Free Qty
                        </label>
                        <input
                          type="number"
                          value={item.freeQuantity}
                          onChange={(e) => updateItem(index, 'freeQuantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purchase Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          MRP <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.mrp}
                          onChange={(e) => updateItem(index, 'mrp', parseFloat(e.target.value) || 0)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={item.sellingPrice}
                          onChange={(e) => updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Rate (%)
                        </label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateItem(index, 'gstRate', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount (₹)
                        </label>
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Total
                        </label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium">
                          ₹{calculateItemTotal(item).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Charges & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Additional Charges */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Charges</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freight Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.freightCharges}
                    onChange={(e) => setFormData({ ...formData, freightCharges: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Packaging Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.packagingCharges}
                    onChange={(e) => setFormData({ ...formData, packagingCharges: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CREDIT">Credit</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                {formData.paymentStatus !== 'UNPAID' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-emerald-50 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Total GST:</span>
                <span>₹{totals.totalGST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Additional Charges:</span>
                <span>₹{((formData.freightCharges || 0) + (formData.packagingCharges || 0) + (formData.otherCharges || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Discount:</span>
                <span>- ₹{(formData.discount || 0).toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-emerald-200 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Grand Total:</span>
                  <span>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href="/dashboard/purchases"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
