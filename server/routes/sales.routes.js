import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { createSale, getAllSales, getSaleById, getSalesAnalytics, updateSaleStatus } from "../controllers/sale.controller.js";
import { uploadPrescriptionImage } from "../middleware/upload.middleware.js";

const salesRoutes = express.Router()

salesRoutes.use(protect)

salesRoutes.get('/',getAllSales)
salesRoutes.get('/analytics',getSalesAnalytics)
salesRoutes.get('/:id',getSaleById)

salesRoutes.post('/', uploadPrescriptionImage ,createSale)
salesRoutes.put('/:id/status',restrictTo('admin' , 'pharmacist'), updateSaleStatus)

export default salesRoutes