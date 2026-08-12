import type { MicroserviceResponseDTO } from "../../dto/MicroserviceDTOs";

export interface IMicroserviceRepository {
  consultarPorDominio(dominio: string): Promise<MicroserviceResponseDTO | null>;
  consultarPorCorreo(correo: string): Promise<MicroserviceResponseDTO | null>;
  consultarPorRuc(ruc: string): Promise<MicroserviceResponseDTO | null>;
}
