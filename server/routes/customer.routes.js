import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { addAllergy, addMedicalHistory, createCustomer, deleteCustomer, getAllCustomers, getCustomerById, getCustomerStats, updateCustomer, updateLoyaltyPoints } from "../controllers/customer.controller.js";

const customerRoutes = express.Router()

customerRoutes.use(protect)

customerRoutes.get('/',getAllCustomers)
customerRoutes.get('/status' , getCustomerStats)
customerRoutes.get('/:id' , getCustomerById)

customerRoutes.post('/',createCustomer)
customerRoutes.post('/:id/medical-history',addMedicalHistory)
customerRoutes.post('/:id/allergies',addAllergy)

customerRoutes.put('/:id' , updateCustomer)
customerRoutes.put('/:id/loyalty-points' , updateLoyaltyPoints)

customerRoutes.delete('/:id' , restrictTo('admin') ,deleteCustomer)

export default customerRoutes