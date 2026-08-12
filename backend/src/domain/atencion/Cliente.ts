export interface ClienteData {
  id: string;
  nombre: string;
  iniciales: string;
  dominio: string;
  email?: string;
  telefono?: string;
  pais: string;
  ruc?: string;
  tipoCliente: "high_touch" | "low_touch" | "tech_touch";
  productoPrincipal?: string;
  version?: string;
}

export class Cliente {
  readonly id: string;
  readonly nombre: string;
  readonly iniciales: string;
  readonly dominio: string;
  readonly email?: string;
  readonly telefono?: string;
  readonly pais: string;
  readonly ruc?: string;
  readonly tipoCliente: "high_touch" | "low_touch" | "tech_touch";
  readonly productoPrincipal?: string;
  readonly version?: string;

  constructor(data: ClienteData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.iniciales = data.iniciales;
    this.dominio = data.dominio;
    this.email = data.email;
    this.telefono = data.telefono;
    this.pais = data.pais;
    this.ruc = data.ruc;
    this.tipoCliente = data.tipoCliente;
    this.productoPrincipal = data.productoPrincipal;
    this.version = data.version;
  }

  toJSON(): ClienteData {
    return {
      id: this.id,
      nombre: this.nombre,
      iniciales: this.iniciales,
      dominio: this.dominio,
      email: this.email,
      telefono: this.telefono,
      pais: this.pais,
      ruc: this.ruc,
      tipoCliente: this.tipoCliente,
      productoPrincipal: this.productoPrincipal,
      version: this.version,
    };
  }
}
