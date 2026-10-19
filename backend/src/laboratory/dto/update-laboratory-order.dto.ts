import { LaboratoryOrderContentDto } from './laboratory-order-items.dto';

// Modificación parcial (criterio 2.4): diagnóstico, notas y exámenes.
// Si se envía tests o custom_tests, esa lista reemplaza a la anterior; la orden
// debe seguir teniendo al menos un examen.
export class UpdateLaboratoryOrderDto extends LaboratoryOrderContentDto {}
