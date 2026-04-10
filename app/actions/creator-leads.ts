"use server";

export type CreatorLeadActionState = {
  error: string;
  success: boolean;
};

export async function createCreatorLeadAction() {
  return {
    error: "Creator lead entry has been removed from the CRM.",
    success: false
  };
}
