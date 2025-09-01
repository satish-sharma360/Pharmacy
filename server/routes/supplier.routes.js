import express, { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { createSupplier, deleteSupplier, getAllSuppliers, getSupplierById, getSupplierStats, toggleSupplierStatus, updateSupplier } from "../controllers/supplier.controller.js";


const supplierRoutes = express.Router()

supplierRoutes.use(protect)

supplierRoutes.get('/' ,getAllSuppliers)
supplierRoutes.get('/stats' ,getSupplierStats)
supplierRoutes.get('/:id' ,getSupplierById)

// POST routes (Admin and Pharmacist only)
supplierRoutes.post('/',restrictTo('admin' ,'pharmacist') , createSupplier)

// PUT routes (Admin and Pharmacist only)
supplierRoutes.put('/:id',restrictTo('admin' ,'pharmacist'), updateSupplier)
supplierRoutes.put('/:id/toggle-status' , restrictTo('admin' , 'pharmacist') , toggleSupplierStatus)

supplierRoutes.delete('/:id' , restrictTo('admin') , deleteSupplier)

export default supplierRoutes