import express from "express";
import { createMedicine, deleteMedicine, getAllMedicines, getExpiredMedicines, getExpiringSoonMedicines, getLowStockMedicines, getMedicineById, updateMedicine, updateStock } from "../controllers/medicine.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { uploadMedicineImage } from "../middleware/upload.middleware.js";


const medicineRoute = express.Router()
medicineRoute.use(protect)

medicineRoute.get('/',getAllMedicines)
medicineRoute.get('/low-stock',getLowStockMedicines)
medicineRoute.get('/expired',getExpiredMedicines)
medicineRoute.get('/expiring-soon',getExpiringSoonMedicines)
medicineRoute.get('/:id',getMedicineById)

// POST routes (Admin and Pharmacist only)
medicineRoute.post('/' , restrictTo('admin' ,'pharmacist'), uploadMedicineImage, createMedicine)

// PUT routes (Admin and Pharmacist only)
medicineRoute.put('/:id', restrictTo('admin' ,'pharmacist') , uploadMedicineImage , updateMedicine)

medicineRoute.put('/:id/stoke',restrictTo('admin', 'pharmacist'), updateStock)

medicineRoute.delete('/:id' , restrictTo('admin') , deleteMedicine)

export default medicineRoute