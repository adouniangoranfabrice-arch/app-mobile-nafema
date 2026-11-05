import { api } from "@/api/client";
import { Iepp } from "@/data/drenas";

type CreateIeppResponse = {
  success: boolean;
  message: string;
  data: Iepp;
};

/** Crée une IEPP et renvoie le message de confirmation du serveur, avec l'IEPP créée */
export async function createIepp(iepp: {
  drena_id: number | string;
  code: string;
  nom: string;
}) {
  const { data } = await api.post<CreateIeppResponse>("/iepps", iepp);
  return { message: data.message, iepp: data.data };
}
