export interface Person {
  id?: string;
  nombre: string;
  cex: string;
  num_pers: string;
  fecha_incorporacion: string;
  mail_empresa: string;
  grupo: string;
  categoria: string;
  oficina: string;
  skill1: string;
  skill2: string;
  nivel_ingles: string;
  squad_lead: string;
  created_at?: string;
  updated_at?: string;
}

export interface SquadLead {
  id: string;
  name: string;
  email?: string;
  squad_name?: string;
  created_at?: string;
}