-- Toda ficha de ingreso nueva incluye la historia de longevidad (la Dra. quiere los mismos campos para todos). SOLO CAMBIA EL VALOR POR DEFECTO:
-- las fichas ya creadas conservan lo que tenían. El bot de WhatsApp crea sus fichas sin indicarlo, así que también las incluye.
alter table public.fichas_ingreso alter column incluye_longevidad set default true;
